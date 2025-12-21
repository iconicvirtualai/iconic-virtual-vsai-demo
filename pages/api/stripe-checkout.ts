// pages/api/stripe-checkout.ts
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

  const { jobId, selectedIndex } = req.body as {
    jobId?: string;
    selectedIndex?: number;
  };

  if (!jobId) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing jobId in request body." });
  }

  const idx =
    typeof selectedIndex === "number" && Number.isFinite(selectedIndex)
      ? Math.max(0, Math.floor(selectedIndex))
      : 0;

  // Always use your real site URL (so it doesn't show vercel.app in Wix)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (req.headers.host ? `https://${req.headers.host}` : "http://localhost:3000");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      // Collect phone so Twilio can send a text
      phone_number_collection: { enabled: true },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 500,
            product_data: {
              name: "Virtual Staging Render",
              description: "High-resolution virtually staged interior image",
            },
          },
        },
      ],

      metadata: {
        jobId,
        selectedIndex: String(idx),
      },

      // include session_id for post-checkout processing
      success_url: `${siteUrl}/success?jobId=${encodeURIComponent(
        jobId
      )}&selectedIndex=${encodeURIComponent(
        String(idx)
      )}&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${siteUrl}/?checkout=cancelled`,
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
