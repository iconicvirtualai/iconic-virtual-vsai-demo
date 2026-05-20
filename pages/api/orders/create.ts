import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";

interface OrderData {
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  orderType: "ai-staging" | "pro-staging" | "video-editing";
  createdAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { address, firstName, lastName, email, phone, notes, orderType, createdAt } = req.body as OrderData;

  if (!address || !firstName || !lastName || !email || !orderType) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    // Demo mode: no Firebase
    if (!db || typeof db.collection !== "function") {
      const demoOrderId = `ORD-${Date.now()}`;
      return res.status(200).json({
        ok: true,
        orderId: demoOrderId,
        data: {
          orderId: demoOrderId,
          address,
          firstName,
          lastName,
          email,
          orderType,
          status: "draft",
          createdAt: new Date().toISOString(),
          isDemo: true,
        },
      });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Save to Firestore
    const ordersCollection = db.collection("orders");
    const docRef = await ordersCollection.doc(orderId).set({
      orderId,
      address,
      firstName,
      lastName,
      email,
      phone: phone || "",
      notes: notes || "",
      orderType,
      status: "draft",
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Also index by email for quick lookup
    const userOrders = db.collection("users").doc(email);
    await userOrders.collection("orders").doc(orderId).set({
      orderId,
      orderType,
      status: "draft",
      createdAt: createdAt || new Date().toISOString(),
      address,
    });

    return res.status(200).json({
      ok: true,
      orderId,
      data: {
        orderId,
        address,
        firstName,
        lastName,
        email,
        orderType,
        status: "draft",
        createdAt: createdAt || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[/api/orders/create] error", error);

    // Fallback to demo mode on error
    const demoOrderId = `ORD-${Date.now()}`;
    return res.status(200).json({
      ok: true,
      orderId: demoOrderId,
      data: {
        orderId: demoOrderId,
        address,
        firstName,
        lastName,
        email,
        orderType,
        status: "draft",
        createdAt: new Date().toISOString(),
        isDemo: true,
      },
    });
  }
}
