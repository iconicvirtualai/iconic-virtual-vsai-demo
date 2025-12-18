import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Stripe v16+ (matches the package.json update you made)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Body = {
  email: string;
  phone?: string;
  fullName?: string;

  // REQUIRED: must be the final chosen render file link (R2/S3/public signed URL etc.)
  downloadUrl: string;

  // OPTIONAL: public image URL for MMS preview (Twilio needs a public URL)
  previewUrl?: string;

  // pricing
  amountCents: number; // e.g. 1500 for $15.00
  currency?: string;   // default "usd"

  // redirect paths (relative)
  successPath?: string; // default "/?paid=1"
  cancelPath?: string;  // default "/?canceled=1"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      email,
      phone,
      fullName,
      downloadUrl,
      previewUrl,
      amountCents,
      currency,
      successPath,
      cancelPath,
    } = (req.body || {}) as Body;

    if (!email) return res.status(400).json({ error: "Missing email" });
    if (!downloadUrl) return res.status(400).json({ error: "Missing downloadUrl" });
    if (!amountCents || Number(amountCents) < 50) {
      return res.status(400).json({ error: "Missing/invalid amountCents" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iconicvirtual.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      // Collect phone in Stripe Checkout UI (helps delivery text)
      phone_number_collection: { enabled: true },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (currency || "usd").toLowerCase(),
            unit_amount: Number(amountCents),
            product_data: {
              name: "IconicVirtual.AI Render Download",
              description: "Your chosen staged render download",
            },
          },
        },
      ],

      // 🔥 Webhook reads these values to send delivery
      metadata: {
        email,
        phone: phone || "",
        full_name: fullName || "",
        download_url: downloadUrl,
        preview_url: previewUrl || "",
      },

      success_url: `${siteUrl}${successPath || "/?paid=1"}`,
      cancel_url: `${siteUrl}${cancelPath || "/?canceled=1"}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error("create-checkout-session error:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
