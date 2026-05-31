// pages/api/dashboard/purchase-credits.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" });

const PRICE_MAP: Record<string, { name: string; credits: number; type: "one_time" | "subscription"; category: string }> = {
  "price_1SfpAJCRfvDEtw05sLJJV2l6": { name: "Small AI Pack", credits: 10, type: "one_time", category: "ai" },
  "price_1SfpB1CRfvDEtw05Ot05yIiM": { name: "Medium AI Pack", credits: 40, type: "one_time", category: "ai" },
  "price_1SfpBoCRfvDEtw05CIjrT22M": { name: "Big AI Pack", credits: 85, type: "one_time", category: "ai" },
  "price_1SfpCgCRfvDEtw05OPv3bp4n": { name: "Single Room Traditional", credits: 1, type: "one_time", category: "traditional" },
  "price_1SfpDMCRfvDEtw054NgbiHCe": { name: "Small Property Traditional", credits: 10, type: "one_time", category: "traditional" },
  "price_1SfpDpCRfvDEtw05B5SLOA9I": { name: "Large Property Traditional", credits: 20, type: "one_time", category: "traditional" },
  "price_1SfomqCRfvDEtw05fsBsZSDo": { name: "AI Starter", credits: 10, type: "subscription", category: "ai" },
  "price_1SfoqnCRfvDEtw05LVaF8uM5": { name: "AI Premium", credits: 40, type: "subscription", category: "ai" },
  "price_1SforxCRfvDEtw052rdFBqmK": { name: "AI Pro", credits: 160, type: "subscription", category: "ai" },
  "price_1Sfow3CRfvDEtw05TKPIkgbZ": { name: "T Starter", credits: 10, type: "subscription", category: "traditional" },
  "price_1Sfp7qCRfvDEtw05c4FxCYlG": { name: "T Premium", credits: 20, type: "subscription", category: "traditional" },
  "price_1Sfp90CRfvDEtw0566rRv8QO": { name: "T Pro", credits: 50, type: "subscription", category: "traditional" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });

  const { priceId } = req.body;
  if (!priceId || !PRICE_MAP[priceId]) return res.status(400).json({ ok: false, error: "Invalid priceId" });

  const plan = PRICE_MAP[priceId];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.iconicvirtual.ai";

  try {
    const userSnap = await db.collection("users").doc(decoded.userId).get();
    const userEmail = userSnap.exists ? userSnap.data()?.email : decoded.email;

    const session = await stripe.checkout.sessions.create({
      mode: plan.type === "subscription" ? "subscription" : "payment",
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: decoded.userId,
        priceId,
        planName: plan.name,
        credits: String(plan.credits),
        category: plan.category,
        purchaseType: plan.type,
        source: "dashboard",
      },
      success_url: `${siteUrl}/staging-dashboard.html?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/staging-dashboard.html?purchase=canceled`,
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[purchase-credits] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}
