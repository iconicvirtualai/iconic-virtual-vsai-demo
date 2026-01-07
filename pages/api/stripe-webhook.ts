// pages/api/stripe-webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { sendOrderEmail, sendOrderSms } from "../../lib/notify";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const config = {
  api: {
    bodyParser: false, // REQUIRED for Stripe signature verification
  },
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

function buffer(readable: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    readable.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return res.status(500).send("Webhook not configured");

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing Stripe signature");

    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[stripe-webhook] signature error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Invalid signature"}`);
  }

  try {
    // We only act on successful Checkout completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Guard: only send when actually paid
      if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true, skipped: "not_paid" });
      }

      // Retrieve expanded session so we can pull receipt URL safely
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["payment_intent", "payment_intent.latest_charge"],
      });

      const customerEmail = full.customer_details?.email || null;
      const customerPhone = (full.customer_details as any)?.phone || null;

      const meta: any = full.metadata || {};
      const jobId = meta.jobId || null;
      const selectedIndex = meta.selectedIndex ? Number(meta.selectedIndex) : 0;

      // Receipt URL from expanded PaymentIntent.latest_charge
      let receiptUrl: string | null = null;
      const pi = full.payment_intent as any;
      if (pi?.latest_charge?.receipt_url) receiptUrl = pi.latest_charge.receipt_url;

      // IMPORTANT: We do NOT store selectedUrl in metadata (Stripe 500-char limit).
      // Instead we send a link back to your own success page using session_id.
      const downloadPageUrl = `${SITE_URL}/success?session_id=${encodeURIComponent(full.id)}`;
      // ✅ Idempotent write: store order record for portal/admin
      const upsertPayload = {
        stripe_session_id: full.id,
        stripe_payment_intent_id: typeof full.payment_intent === "string" ? full.payment_intent : (full.payment_intent as any)?.id || null,
        amount_total: full.amount_total ?? null,
        currency: full.currency ?? null,
        payment_status: full.payment_status ?? null,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        job_id: jobId,
        selected_index: Number.isFinite(selectedIndex) ? selectedIndex : 0,
        receipt_url: receiptUrl,
        download_page_url: downloadPageUrl,
      };

      const { error: orderErr } = await supabaseAdmin
        .from("orders")
        .upsert(upsertPayload, { onConflict: "stripe_session_id" });

      if (orderErr) {
        console.error("[stripe-webhook] order upsert error:", orderErr);
        // don't fail the webhook if storage hiccups; Stripe will retry anyway
      }

      // Send email (if configured + email exists)
      if (customerEmail) {
        await sendOrderEmail({
          to: customerEmail,
          downloadPageUrl,
          receiptUrl,
          jobId,
          selectedIndex,
        });
      }

      // Send SMS (if configured + phone exists)
      if (customerPhone) {
        await sendOrderSms({
          to: customerPhone,
          downloadPageUrl,
          jobId,
          selectedIndex,
        });
      }

      return res.status(200).json({ received: true });
    }

    // Ignore other events
    return res.status(200).json({ received: true, ignored: event.type });
  } catch (err: any) {
    console.error("[stripe-webhook] handler error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Webhook handler failed" });
  }
}
