import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const PLANS: Record<string, { name: string; description: string; amountCents: number; images: number; type: string }> = {
  "ai-5":     { name: "AI Starter Pack",       description: "5 AI staged photos",              amountCents: 500,   images: 5,  type: "one_time" },
  "ai-25":    { name: "AI Best Value Bundle",   description: "25 AI staged photos",             amountCents: 5000,  images: 25, type: "one_time" },
  "ai-50":    { name: "AI Agent Pro Pack",      description: "50 AI staged photos",             amountCents: 7500,  images: 50, type: "one_time" },
  "ai-100":   { name: "AI Brokerage Pack",      description: "100 AI staged photos",            amountCents: 10000, images: 100,type: "one_time" },
  "pro-1":    { name: "Pro Single Room",        description: "1 professionally staged image",   amountCents: 1000,  images: 1,  type: "one_time" },
  "pro-5":    { name: "Pro 5-Room Bundle",      description: "5 professionally staged images",  amountCents: 4000,  images: 5,  type: "one_time" },
  "pro-10":   { name: "Pro 10-Room Bundle",     description: "10 professionally staged images", amountCents: 7500,  images: 10, type: "one_time" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { planId, email } = req.body || {};

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!planId || !PLANS[planId]) return res.status(400).json({ error: "Invalid plan" });

    const plan = PLANS[planId];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.iconicvirtual.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.amountCents,
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
        },
      ],
      metadata: {
        plan_id: planId,
        email,
        images: String(plan.images),
        plan_type: plan.type,
        source: "offers_page",
      },
      success_url: `${siteUrl}/offers.html?success=1&plan=${planId}`,
      cancel_url: `${siteUrl}/offers.html?canceled=1`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error("create-plan-checkout error:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
