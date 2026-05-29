// pages/api/stripe-webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { sendOrderEmail, sendOrderSms } from "../../lib/notify";
import { db } from "../../lib/firebaseAdmin";

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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true, skipped: "not_paid" });
      }

      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["payment_intent", "payment_intent.latest_charge"],
      });

      const customerEmail = full.customer_details?.email || null;
      const customerPhone = (full.customer_details as any)?.phone || null;

      const meta: any = full.metadata || {};
      const jobId = meta.jobId || null;
      const selectedIndex = meta.selectedIndex ? Number(meta.selectedIndex) : 0;

      let receiptUrl: string | null = null;
      const pi = full.payment_intent as any;
      if (pi?.latest_charge?.receipt_url) receiptUrl = pi.latest_charge.receipt_url;

      const downloadPageUrl = `${SITE_URL}/success?session_id=${encodeURIComponent(full.id)}`;

      let sourceImageUrl: string | null = null;
      let roomType: string | null = null;
      let style: string | null = null;
      let renderId: string | null = null;

      if (jobId) {
        try {
          const jobSnap = await db.collection("jobs").doc(jobId).get();
          if (jobSnap.exists) {
            const jobData = jobSnap.data();
            sourceImageUrl = jobData?.source?.publicUrl || null;
            roomType = jobData?.room_type || null;
            style = jobData?.style || null;
            renderId = jobData?.renderId || jobId;
          }
        } catch (jobReadErr) {
          console.error("[stripe-webhook] job read error:", jobReadErr);
        }
      }

      const now = new Date().toISOString();

      const orderDoc = {
        orderId: full.id,
        orderNumber: null,
        userId: null,
        accountId: null,
        customerEmail,
        customerPhone,
        orderType: "ai_staging",
        status: "paid_pending_final",
        paymentStatus: "paid",
        jobId,
        renderId: renderId || jobId,
        selectedIndex: Number.isFinite(selectedIndex) ? selectedIndex : 0,
        sourceImageUrl,
        previewImageUrl: null,
        selectedUrl: null,
        finalImageUrl: null,
        downloadUrl: null,
        roomType,
        style,
        stripeCheckoutSessionId: full.id,
        stripePaymentIntentId:
          typeof full.payment_intent === "string"
            ? full.payment_intent
            : (full.payment_intent as any)?.id || null,
        amountTotal: full.amount_total ?? null,
        currency: full.currency ?? null,
        receiptUrl,
        createdAt: now,
        updatedAt: now,
        paidAt: now,
        completedAt: null,
      };

      try {
        await db.collection("orders").doc(full.id).set(orderDoc, { merge: true });
      } catch (orderErr) {
        console.error("[stripe-webhook] order write error:", orderErr);
      }

      if (jobId) {
        try {
          await db.collection("jobs").doc(jobId).update({
            paymentStatus: "paid",
            status: "paid_pending_final",
            selectedIndex: Number.isFinite(selectedIndex) ? selectedIndex : 0,
            stripeSessionId: full.id,
            paidAt: now,
            updatedAt: now,
          });
        } catch (jobUpdateErr) {
          console.error("[stripe-webhook] job update error:", jobUpdateErr);
        }
      }

      if (customerEmail) {
        await sendOrderEmail({
          to: customerEmail,
          downloadPageUrl,
          receiptUrl,
          jobId,
          selectedIndex,
        });
      }

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

    return res.status(200).json({ received: true, ignored: event.type });
  } catch (err: any) {
    console.error("[stripe-webhook] handler error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Webhook handler failed" });
  }
}
