// pages/api/orders/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";

type Resp =
  | { ok: true; orders: any[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const email = (req.query.email as string | undefined)?.trim() || null;
  const userId = (req.query.userId as string | undefined)?.trim() || null;

  if (!email && !userId) {
    return res.status(400).json({
      ok: false,
      error: "Provide ?email= or ?userId= query parameter.",
    });
  }

  try {
    let query: FirebaseFirestore.Query = db.collection("orders");

    // Prefer email lookup (always present after checkout).
    // userId will be useful once auth is wired up in Phase 2.
    if (email) {
      query = query.where("customerEmail", "==", email);
    } else if (userId) {
      query = query.where("userId", "==", userId);
    }

    query = query.orderBy("createdAt", "desc");

    const snap = await query.get();
    const orders = snap.docs.map((d) => d.data());

    return res.status(200).json({ ok: true, orders });
  } catch (err: any) {
    console.error("[orders/me] error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to fetch orders",
    });
  }
}
