import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

type VerifyResponse =
  | {
      ok: true;
      paid: boolean;
      jobId: string | null;
      email: string | null;
      receiptUrl: string | null;
      paymentStatus: string | null;
    }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!stripe) {
    return res
      .status(500)
      .json({ ok: false, error: "Stripe is not configured on the server." });
  }

  const session_id = req.query.session_id;
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id;

  if (!sessionId) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing session_id in query." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

    const paid = session.payment_status === "paid";

    const jobId =
      session.metadata?.jobId ||
      session.client_reference_id ||
      null;

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      null;

    let receiptUrl: string | null = null;

    const pi = session.payment_intent as Stripe.PaymentIntent | string | null;

    if (pi && typeof pi !== "string") {
      const charge = pi.latest_charge as Stripe.Charge | string | null;
      if (charge && typeof charge !== "string") {
        receiptUrl = charge.receipt_url || null;
      }
    }

    return res.status(200).json({
      ok: true,
      paid,
      jobId,
      email,
      receiptUrl,
      paymentStatus: session.payment_status || null,
    });
  } catch (err: any) {
    console.error("[stripe-verify] error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to verify checkout session.",
    });
  }
}
