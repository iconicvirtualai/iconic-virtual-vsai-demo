import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { hashPassword, createToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 6) {
    return res.status(400).json({ ok: false, error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ ok: false, error: "An account with this email already exists" });
    }

    const { hash, salt } = hashPassword(password);
    const userRef = db.collection("users").doc();
    const now = new Date().toISOString();

    await userRef.set({
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
      creditsRemaining: 0,
      totalStagings: 0,
      activePlan: "free",
      createdAt: now,
      updatedAt: now,
    });

    const token = await createToken(userRef.id, normalizedEmail);

    return res.status(201).json({
      ok: true,
      data: { userId: userRef.id, email: normalizedEmail, token },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ ok: false, error: "Server error. Please try again." });
  }
}
