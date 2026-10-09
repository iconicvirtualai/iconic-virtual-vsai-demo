// pages/api/stripe-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { HD_DOWNLOAD_AMOUNT_CENTS } from "../../lib/catalog";
import { getPublicSiteUrl, getStripe, getStripeSecretKey } from "../../lib/stripeServer";

const STRIPE_SECRET_KEY = getStripeSecretKey();

type Resp = { ok: true; url: string } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!STRIPE_SECRET_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "STRIPE_SECRET_KEY is not set." });
  }

  try {
    const { jobId, selectedIndex } = req.body as {
      jobId?: string;
      selectedIndex?: number;
    };

    if (!jobId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing jobId in request body." });
    }

    const stripe = getStripe();
    const baseUrl = getPublicSiteUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      // optional but helpful: lets Stripe collect phone if you want SMS later
      phone_number_collection: { enabled: true },

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: HD_DOWNLOAD_AMOUNT_CENTS,
            product_data: {
              name: "Virtual Staging – High Resolution Download",
            },
          },
          quantity: 1,
        },
      ],

      // ✅ Only store SHORT values (Stripe metadata limit is 500 chars/value)
      metadata: {
        jobId,
        selectedIndex: String(
          typeof selectedIndex === "number" ? selectedIndex : 0
        ),
      },

      // ✅ success page reads session_id and then calls /api/post-checkout
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=1`,
    });

    if (!session.url) {
      return res
        .status(500)
        .json({ ok: false, error: "Stripe did not return a checkout URL." });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[stripe-checkout] error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to create Stripe session.",
    });
  }
}
