—// pages/api/dashboard/fulfill-purchase.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";
const admin = require("firebase-admin");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ ok: false, error: "sessionId required" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ ok: false, error: "Payment not completed" });
    }

    const meta = session.metadata || {};
    const userId = meta.userId;
    if (userId !== decoded.userId) {
      return res.status(403).json({ ok: false, error: "User mismatch" });
    }

    const credits = parseInt(meta.credits || "0", 10);
    const planName = meta.planName || "Unknown";
    const purchaseType = meta.purchaseType || "one_time";
    const category = meta.category || "ai";

    // Check if already fulfilled
    const existingOrder = await db.collection("orders").doc(sessionId).get();
    if (existingOrder.exists && existingOrder.data()?.fulfilled) {
      return res.status(200).json({ ok: true, message: "Already fulfilled", credits });
    }

    const now = new Date().toISOString();
    const userRef = db.collection("users").doc(userId);
    const userUpdate: Record<string, any> = { updatedAt: now };

    if (purchaseType === "subscription") {
      userUpdate.activePlan = planName;
      userUpdate.planCategory = category;
      userUpdate.planCreditsPerMonth = credits;
      userUpdate.planStartedAt = now;
      userUpdate.planRenewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    userUpdate.creditsRemaining = admin.firestore.FieldValue.increment(credits);
    await userRef.update(userUpdate);

    // Record purchase
    await db.collection("orders").doc(sessionId).set({
      orderId: sessionId,
      userId,
      type: purchaseType === "subscription" ? "plan_purchase" : "credit_purchase",
      planName,
      category,
      credits,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || null,
      paymentStatus: "paid",
      fulfilled: true,
      fulfilledAt: now,
      createdAt: now,
    }, { merge: true });

    // Log activity
    await db.collection("activityLog").add({
      userId,
      type: "credit_purchase",
      description: purchaseType === "subscription"
        ? "Subscribed to " + planName + " (+" + credits + " credits/mo)"
        : "Purchased " + planName + " (+" + credits + " credits)",
      credits,
      planName,
      timestamp: now,
    });

    return res.status(200).json({ ok: true, credits, planName, message: "Credits added!" });
  } catch (err: any) {
    console.error("[fulfill-purchase] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}
