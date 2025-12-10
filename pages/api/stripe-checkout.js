// pages/api/stripe-checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { downloadUrl } = req.body || {};

  if (!downloadUrl) {
    return res.status(400).json({ error: "downloadUrl is required" });
  }

  try {
    const origin = req.headers.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 500,
            product_data: {
              name: "Virtual Staging Render"
            }
          },
          quantity: 1
        }
      ],
      success_url: `${origin}/success?downloadUrl=${encodeURIComponent(
        downloadUrl
      )}`,
      cancel_url: `${origin}/`
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: "Stripe error" });
  }
}
