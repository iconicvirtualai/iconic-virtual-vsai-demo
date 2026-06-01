// pages/api/dashboard/activity.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });
  const userId = decoded.userId;

  if (req.method === "GET") {
    const { type, limit: limitStr } = req.query;
    const maxResults = Math.min(parseInt(limitStr as string) || 100, 500);
    try {
      let query: any = db.collection("activityLog").where("userId", "==", userId);
      if (type && type !== "all") query = query.where("type", "==", type);
      const snap = await query.get();
      const activities: any[] = [];
      snap.forEach((doc: any) => activities.push({ id: doc.id, ...doc.data() }));
      activities.sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      return res.status(200).json({ ok: true, activities: activities.slice(0, maxResults) });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
