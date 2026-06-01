// pages/api/dashboard/orders.ts
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
    try {
      const snap = await db.collection("orders").where("userId", "==", userId).get();
      const orders: any[] = [];
      snap.forEach((doc: any) => orders.push({ id: doc.id, ...doc.data() }));
      orders.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.status(200).json({ ok: true, orders });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    const { address, room, style, type, notes, projectId, projectName, firstName, lastName, email, phone } = req.body || {};
    if (!address) return res.status(400).json({ ok: false, error: "Address is required" });
    const now = new Date().toISOString();
    const orderData = { userId, address: address.trim(), room: (room || "").trim() || "General", style: style || "modern", type: type || "ai", notes: notes || "", projectId: projectId || null, projectName: projectName || "", customerName: ((firstName || "") + " " + (lastName || "")).trim(), customerEmail: email || "", customerPhone: phone || "", status: "draft", paymentStatus: "unpaid", createdAt: now, updatedAt: now };
    try {
      const ref = await db.collection("orders").add(orderData);
      return res.status(201).json({ ok: true, order: { id: ref.id, ...orderData } });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ ok: false, error: "orderId required" });
    try {
      const orderRef = db.collection("orders").doc(orderId);
      const snap = await orderRef.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: "Order not found" });
      if (snap.data()?.userId !== userId) return res.status(403).json({ ok: false, error: "Not your order" });
      await orderRef.delete();
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "PATCH") {
    const { orderId, status } = req.body || {};
    if (!orderId) return res.status(400).json({ ok: false, error: "orderId required" });
    try {
      const orderRef = db.collection("orders").doc(orderId);
      const snap = await orderRef.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: "Order not found" });
      if (snap.data()?.userId !== userId) return res.status(403).json({ ok: false, error: "Not your order" });
      await orderRef.update({ status, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
