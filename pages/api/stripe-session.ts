import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

type Resp =
  | {
      ok: true;
      data: {
        id: string;
        payment_status: Stripe.Checkout.Session.PaymentStatus | null;
        customer_email: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        receipt_url: string | null;
        metadata: Record<string, string> | null;
      };
    }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ ok: false, error: "Stripe not configured" });
  }

  const session_id = req.query.session_id;
  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ ok: false, error: "Missing session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const customer_email = session.customer_details?.email || null;
    const customer_name = session.customer_details?.name || null;
    const customer_phone = session.customer_details?.phone || null;

    let receipt_url: string | null = null;

    // Pull receipt from latest_charge (expanded)
    if (session.payment_intent && typeof session.payment_intent === "string") {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
        expand: ["latest_charge"],
      });

      const latest = pi.latest_charge;
      if (latest && typeof latest !== "string") {
        receipt_url = latest.receipt_url || null;
      } else if (latest && typeof latest === "string") {
        // fallback: retrieve the charge by id
        const ch = await stripe.charges.retrieve(latest);
        receipt_url = ch.receipt_url || null;
      }
    }

    return res.status(200).json({
      ok: true,
      data: {
        id: session.id,
        payment_status: session.payment_status || null,
        customer_email,
        customer_name,
        customer_phone,
        receipt_url,
        metadata: (session.metadata as any) || null,
      },
    });
  } catch (err: any) {
    console.error("[stripe-session] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error" });
  }
}
