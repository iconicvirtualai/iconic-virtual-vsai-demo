// pages/api/stripe-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn(
    "[stripe-checkout] STRIPE_SECRET_KEY is not set. Checkout will not work."
  );
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      // Use whatever version you're pinned to in package.json if different
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

  const { jobId } = req.body as { jobId?: string };

  if (!jobId) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing jobId in request body." });
  }

  try {
    // Figure out base site URL for success/cancel redirects
    const originHeader = req.headers.origin;
    const fallbackOrigin =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const origin =
      typeof originHeader === "string" && originHeader.length > 0
        ? originHeader
        : fallbackOrigin;

    // Simple flat price for now. You can later vary this by room type, etc.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 500, // $5.00 – adjust as needed
            product_data: {
              name: "Virtual Staging Render",
              description: "High-resolution virtually staged interior image",
            },
          },
        },
      ],
      success_url: `${origin}/success?jobId=${encodeURIComponent(jobId)}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: {
        jobId,
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
