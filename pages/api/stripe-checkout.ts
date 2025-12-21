import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

type CheckoutResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckoutResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!stripe) {
    return res
      .status(500)
      .json({ ok: false, error: "Stripe is not configured on the server." });
  }

  const { jobId, renderId, variationId } = req.body as {
    jobId?: string;
    renderId?: string;
    variationId?: string | null;
  };

  if (!jobId) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing jobId in request body." });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof req.headers.origin === "string" ? req.headers.origin : "") ||
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      // Stripe will collect email automatically, and we ENABLE phone collection for SMS.
      phone_number_collection: { enabled: true },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 500, // $5.00
            product_data: {
              name: "Virtual Staging Download",
              description: "High-resolution staged image download",
            },
          },
        },
      ],

      // Important: include session_id in the redirect so the success page can verify & send delivery
      success_url: `${baseUrl}/success?jobId=${encodeURIComponent(
        jobId
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,

      metadata: {
        jobId,
        renderId: renderId || "",
        variationId: variationId || "",
        deliverySent: "0",
      },
    });

    if (!session.url) {
      return res.status(500).json({
        ok: false,
        error: "Stripe did not return a checkout URL.",
      });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[stripe-checkout] error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to create checkout session.",
    });
  }
}
