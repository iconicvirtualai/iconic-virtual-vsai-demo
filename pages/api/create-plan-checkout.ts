import type { NextApiRequest, NextApiResponse } from "next";
import { resolvePublicProduct } from "../../lib/catalog";
import { getPublicSiteUrl, getStripe, getStripeSecretKey } from "../../lib/stripeServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!getStripeSecretKey()) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY is not set." });
  }

  try {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const product = resolvePublicProduct(body);
    if (!product) {
      return res.status(400).json({
        error: "Unknown product. Choose a pack from the pricing page.",
      });
    }

    const siteUrl = getPublicSiteUrl(req);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: product.publicCheckoutMode,
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: product.amountCents,
            product_data: {
              name: product.name,
              description: product.description,
            },
          },
        },
      ],
      metadata: {
        productId: product.id,
        plan_id: product.id,
        credits: String(product.credits),
        category: product.category,
        planName: product.name,
        purchaseType: product.publicCheckoutMode === "subscription" ? "subscription" : "one_time",
        email: email || "",
        source: body.planId ? "offers_page" : "homepage_pricing",
      },
      success_url: siteUrl + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: siteUrl + "/home.html#pricing",
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error("create-plan-checkout error:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
