import type { NextApiRequest, NextApiResponse } from "next";

type Order = {
  id: string;
  jobId: string;
  createdAt: string;
  imageUrl?: string;
  stagedUrl?: string;
  amount?: number;
  status: "pending" | "completed" | "failed";
  roomType?: string;
  style?: string;
};

type ApiResponse = 
  | { ok: true; data: Order[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // TODO: Get user ID from auth context/token
    // For now, return empty array if Firebase is not configured
    const { db } = await import("../../lib/firebaseAdmin");

    try {
      // Attempt to fetch from Firestore
      const snapshot = await db.collection("orders").limit(50).get();
      const orders = snapshot.docs.map((doc) => doc.data()) as Order[];
      return res.status(200).json({ ok: true, data: orders });
    } catch (firebaseError) {
      // If Firebase is not configured, return empty list with warning
      console.warn("Firebase not configured, returning empty orders:", firebaseError);
      return res.status(200).json({ 
        ok: true, 
        data: [] 
      });
    }
  } catch (err) {
    console.error("orders/me error:", err);
    return res.status(500).json({ 
      ok: false, 
      error: err instanceof Error ? err.message : "Internal server error" 
    });
  }
}
