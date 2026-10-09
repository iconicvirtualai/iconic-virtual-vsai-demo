import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "../../../lib/auth";
import { grantFromCheckoutSession } from "../../../lib/grantCredits";
import { getStripe, getStripeSecretKey } from "../../../lib/stripeServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });

  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ ok: false, error: "sessionId required" });
  if (!getStripeSecretKey()) {
    return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY is not set." });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    if (session.payment_status !== "paid") {
      return res.status(400).json({ ok: false, error: "Payment not completed" });
    }

    const metaUser = session.metadata?.userId || "";
    const paidEmail = (session.customer_details?.email || session.metadata?.email || "").toLowerCase();
    if (metaUser && metaUser !== decoded.userId) {
      return res.status(403).json({ ok: false, error: "User mismatch" });
    }
    if (!metaUser && paidEmail !== decoded.email.toLowerCase()) {
      return res.status(403).json({ ok: false, error: "User mismatch" });
    }

    const linePrice = session.line_items?.data?.[0]?.price;
    const linePriceId = typeof linePrice === "string" ? linePrice : linePrice?.id;
    const result = await grantFromCheckoutSession(
      { ...session, metadata: { ...(session.metadata || {}), userId: decoded.userId } },
      linePriceId
    );

    if (result.status === "skipped") {
      return res.status(400).json({ ok: false, error: "This payment is not a credit pack" });
    }

    return res.status(200).json({
      ok: true,
      credits: result.credits,
      planName: result.planName,
      message: result.status === "already" ? "Already fulfilled" : "Credits added!",
    });
  } catch (err: any) {
    console.error("[fulfill-purchase] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}
