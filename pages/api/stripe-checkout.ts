// pages/api/stripe-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn("[stripe-checkout] STRIPE_SECRET_KEY is not set.");
}

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
      ? selectedIndex
      : 0;

  try {
    // ✅ IMPORTANT: force your production domain here (no Vercel URL)
    // Put this in Vercel env too, but hard-forcing is safest while testing:
    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sites.iconicvirtual.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      // ✅ Needed if you want to text them from Twilio
      phone_number_collection: { enabled: true },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 500, // $5.00
            product_data: {
              name: "Virtual Staging Download",
              description: "High-resolution virtually staged interior image",
            },
          },
        },
      ],

      // ✅ Always include session_id for the success page
      success_url: `${SITE_URL}/success?jobId=${encodeURIComponent(
        jobId
      )}&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${SITE_URL}/?checkout=cancelled`,

      metadata: {
        jobId,
        selectedIndex: String(idx),
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
