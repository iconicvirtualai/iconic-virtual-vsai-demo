// pages/api/auth/me.ts — Get current user profile + stats
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

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
    const userDoc = await db.collection("users").doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const user = userDoc.data()!;

    // Get recent orders
    const ordersSnap = await db
      .collection("orders")
      .where("userId", "==", decoded.userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const orders = ordersSnap.docs.map((d) => {
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

    // Count active projects
    const activeSnap = await db
      .collection("orders")
      .where("userId", "==", decoded.userId)
      .where("status", "in", ["pending", "processing", "queued"])
      .get();

    // Count completed stagings
    const completedSnap = await db
      .collection("orders")
      .where("userId", "==", decoded.userId)
      .where("status", "==", "complete")
      .get();

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
        totalStagings: completedSnap.size + activeSnap.size,
        activeProjects: activeSnap.size,
        completedStagings: completedSnap.size,
        activePlan: user.activePlan || "free",
        createdAt: user.createdAt || "",
        recentOrders: orders,
      },
    });
  } catch (err: any) {
    console.error("Profile error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
