// pages/api/user/update-profile.ts — Read and update user profile
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const token = authHeader.replace("Bearer ", "");
  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }

  const userRef = db.collection("users").doc(decoded.userId);

  // GET — return full profile (minus password fields)
  if (req.method === "GET") {
    try {
      const snap = await userRef.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: "User not found" });
      const data = snap.data() || {};
      delete data.passwordHash;
      delete data.passwordSalt;
      return res.status(200).json({ ok: true, user: { id: decoded.userId, ...data } });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // POST — update profile fields
  if (req.method === "POST") {
    const body = req.body || {};
    const allowedFields = [
      "firstName", "lastName", "phone", "company", "email",
      "licenseNumber", "profilePhoto", "defaultStyle", "defaultRoom",
      "notifyEmail", "notifySms", "notifyPush", "notifyFailedJobs"
    ];

    try {
      const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (typeof body[field] === "string") {
            updates[field] = body[field].trim();
          } else {
            updates[field] = body[field];
          }
        }
      }

      await userRef.update(updates);
      const snap = await userRef.get();
      const data = snap.data() || {};
      delete data.passwordHash;
      delete data.passwordSalt;
      return res.status(200).json({ ok: true, user: { id: decoded.userId, ...data } });
    } catch (err: any) {
      console.error("Update profile error:", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
