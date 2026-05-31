// pages/api/user/change-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken, verifyPassword, hashPassword } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ ok: false, error: "Current and new password required" });
  if (newPassword.length < 8) return res.status(400).json({ ok: false, error: "New password must be at least 8 characters" });

  try {
    const userRef = db.collection("users").doc(decoded.userId);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "User not found" });

    const user = snap.data()!;
    const isValid = verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
    if (!isValid) return res.status(401).json({ ok: false, error: "Current password is incorrect" });

    const { hash, salt } = hashPassword(newPassword);
    await userRef.update({
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ ok: true, message: "Password updated successfully" });
  } catch (err: any) {
    console.error("Change password error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
