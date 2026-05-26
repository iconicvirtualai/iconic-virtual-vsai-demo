// pages/api/auth/me.ts — Get current user profile + stats
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const token = authHeader.replace("Bearer ", "");
  const decoded = await verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }

  try {
    // Get user profile
    const userDoc = await db.collection("users").doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const user = userDoc.data()!;

    // Get all orders for user (single-field query, no composite index needed)
    const ordersSnap = await db
      .collection("orders")
      .where("userId", "==", decoded.userId)
      .get();

    const allOrders = ordersSnap.docs.map((d) => {
      const o = d.data();
      return {
        id: d.id,
        address: o.address || "",
        room: o.room || "",
        style: o.style || "",
        status: o.status || "pending",
        createdAt: o.createdAt || "",
        imageUrl: o.imageUrl || "",
        resultUrl: o.resultUrl || "",
      };
    });

    // Sort by createdAt descending in JS
    allOrders.sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0));

    // Take first 10 as recent orders
    const recentOrders = allOrders.slice(0, 10);

    // Count active (pending/processing/queued) and completed in JS
    const activeStatuses = new Set(["pending", "processing", "queued"]);
    const activeCount = allOrders.filter((o) => activeStatuses.has(o.status)).length;
    const completedCount = allOrders.filter((o) => o.status === "complete").length;

    return res.status(200).json({
      ok: true,
      data: {
        userId: decoded.userId,
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        company: user.company || "",
        creditsRemaining: user.creditsRemaining || 0,
        totalStagings: completedCount + activeCount,
        activeProjects: activeCount,
        completedStagings: completedCount,
        activePlan: user.activePlan || "free",
        createdAt: user.createdAt || "",
        recentOrders: recentOrders,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
