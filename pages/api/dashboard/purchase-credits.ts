import type { NextApiRequest, NextApiResponse } from "next";
import { getProductByStripePriceId } from "../../../lib/catalog";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";
import { getPublicSiteUrl, getStripe, getStripeSecretKey } from "../../../lib/stripeServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });

  if (!getStripeSecretKey()) {
    return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY is not set." });
  }

  const { priceId } = req.body || {};
  const plan = getProductByStripePriceId(priceId);
  if (!plan || !plan.stripePriceId || !plan.dashboardMode) {
    return res.status(400).json({ ok: false, error: "Invalid priceId" });
  }

  const siteUrl = getPublicSiteUrl(req);
  const stripe = getStripe();

  try {
    const userSnap = await db.collection("users").doc(decoded.userId).get();
    const userEmail = userSnap.exists ? userSnap.data()?.email : decoded.email;
    const mode = plan.dashboardMode;

    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: userEmail,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      metadata: {
        userId: decoded.userId,
        priceId: plan.stripePriceId,
        productId: plan.id,
        planName: plan.name,
        credits: String(plan.credits),
        category: plan.category,
        purchaseType: mode === "subscription" ? "subscription" : "one_time",
        source: "dashboard",
      },
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                userId: decoded.userId,
                priceId: plan.stripePriceId,
                productId: plan.id,
                planName: plan.name,
                credits: String(plan.credits),
                category: plan.category,
                email: userEmail || "",
              },
            }
          : undefined,
      success_url: `${siteUrl}/staging-dashboard.html?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/staging-dashboard.html?purchase=canceled`,
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[purchase-credits] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}
