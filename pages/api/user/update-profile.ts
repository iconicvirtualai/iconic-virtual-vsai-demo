// pages/api/user/update-profile.ts — Update user profile info
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
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

  const { firstName, lastName, phone, company } = req.body || {};

  try {
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (typeof firstName === "string") updates.firstName = firstName.trim();
    if (typeof lastName === "string") updates.lastName = lastName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();
    if (typeof company === "string") updates.company = company.trim();

    await db.collection("users").doc(decoded.userId).update(updates);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
