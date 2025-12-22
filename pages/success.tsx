// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

type Resp =
  | {
      ok: true;
      data: {
        paid: boolean;
        jobId: string | null;
        selectedUrl: string | null;
        selectedIndex: number | null;
        receiptUrl: string | null;
        invoiceUrl: string | null;
        customerEmail: string | null;
      };
    }
  | { ok: false; error: string; raw?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!STRIPE_SECRET_KEY) return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY is not set." });

  try {
    const { session_id } = req.body as { session_id?: string };
    if (!session_id) return res.status(400).json({ ok: false, error: "session_id is required" });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    // Expand payment_intent.latest_charge so we can safely pull receipt_url
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

    const paid = session.payment_status === "paid";
    if (!paid) return res.status(400).json({ ok: false, error: "Payment not completed.", raw: session });

    const meta: any = session.metadata || {};
    const jobId = meta.jobId || null;
    const selectedUrl = meta.selectedUrl || null;

    const selectedIndexRaw = meta.selectedIndex;
    const selectedIndex =
      typeof selectedIndexRaw === "string" ? Number(selectedIndexRaw) : null;

    const customerEmail = session.customer_details?.email || null;

    // Receipt URL (safe with expanded latest_charge)
    let receiptUrl: string | null = null;
    const pi = session.payment_intent as any;
    if (pi?.latest_charge?.receipt_url) receiptUrl = pi.latest_charge.receipt_url;

    // Invoice URL: only exists if you’re using invoices/subscriptions; for one-time Checkout usually null
    const invoiceUrl = (session as any)?.invoice?.hosted_invoice_url || null;

    return res.status(200).json({
      ok: true,
      data: {
        paid,
        jobId,
        selectedUrl,
        selectedIndex: Number.isFinite(selectedIndex) ? selectedIndex : 0,
        receiptUrl,
        invoiceUrl,
        customerEmail,
      },
    });
  } catch (err: any) {
    console.error("[post-checkout] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal server error" });
  }
}
