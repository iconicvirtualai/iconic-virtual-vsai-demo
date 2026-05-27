import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const { firstName, lastName, email, phone, propertyAddress, roomCount, stylePreference, styleMode, budget, notes, photos } = req.body || {};

  if (!email) return res.status(400).json({ ok: false, error: "Email is required" });
  if (!propertyAddress) return res.status(400).json({ ok: false, error: "Property address is required" });
  if (!roomCount || Number(roomCount) < 1) return res.status(400).json({ ok: false, error: "Room count is required" });

  try {
    const now = new Date().toISOString();

    // Check if user exists, if not auto-create a stub
    const usersSnap = await db.collection("users").where("email", "==", email.trim().toLowerCase()).limit(1).get();
    let userId = "";
    if (usersSnap.empty) {
      const userRef = await db.collection("users").add({
        email: email.trim().toLowerCase(),
        firstName: (firstName || "").trim(),
        lastName: (lastName || "").trim(),
        phone: (phone || "").trim(),
        source: "pro_order_form",
        createdAt: now,
      });
      userId = userRef.id;
    } else {
      userId = usersSnap.docs[0].id;
    }

    // Create the pro order
    const orderRef = await db.collection("proOrders").add({
      userId,
      firstName: (firstName || "").trim(),
      lastName: (lastName || "").trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || "").trim(),
      propertyAddress: propertyAddress.trim(),
      roomCount: Number(roomCount),
      styleMode: styleMode || "overall",        // "overall" or "per_photo"
      stylePreference: (stylePreference || "").trim(),
      photos: Array.isArray(photos) ? photos : [], // [{url, storagePath, roomLabel, style}]
      budget: (budget || "").trim(),
      notes: (notes || "").trim(),
      status: "new",
      createdAt: now,
    });

    return res.status(200).json({ ok: true, orderId: orderRef.id, message: "Pro order submitted successfully" });
  } catch (err: any) {
    console.error("Pro order error:", err);
    return res.status(500).json({ ok: false, error: "Failed to submit order" });
  }
}
