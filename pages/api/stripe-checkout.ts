// pages/api/stripe-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// IMPORTANT: your installed Stripe types only allow "2023-10-16" here.
// Using "2024-06-20" causes the TypeScript error you’re seeing.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobId } = req.body as { jobId?: string };

  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId" });
  }

  try {
    // TODO: if you later want price per room, pull that from DB or job metadata.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 1500, // <-- change this if your price is different (in cents)
            product_data: {
              name: "Virtual Staging Image",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        jobId,
      },
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://iconic-virtual-vsai-demo.vercel.app"
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://iconic-virtual-vsai-demo.vercel.app"
      }/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[stripe-checkout] error", err);
    return res
      .status(500)
      .json({ error: err.message || "Stripe checkout failed" });
  }
}
