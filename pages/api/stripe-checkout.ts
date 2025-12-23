// pages/api/stripe-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

type Resp = { ok: true; url: string } | { ok: false; error: string };

function getBaseUrl(req: NextApiRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    (req.headers["x-forwarded-protocol"] as string) ||
    "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return `${proto}://${host}`;
}

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

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      // optional but helpful: lets Stripe collect phone if you want SMS later
      phone_number_collection: { enabled: true },

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 500, // $5
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
