// pages/api/orders/all.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";

// TODO: Add admin auth protection in Phase 2

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

  try {
    const snap = await db
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const orders = snap.docs.map((d) => d.data());

    return res.status(200).json({ ok: true, orders });
  } catch (err: any) {
    console.error("[orders/all] error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to fetch orders",
    });
  }
}
