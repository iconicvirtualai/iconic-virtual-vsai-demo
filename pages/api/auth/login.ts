import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyPassword, createToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const snapshot = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ ok: false, error: "Invalid email or password" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const valid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!valid) {
      return res.status(401).json({ ok: false, error: "Invalid email or password" });
    }

    const token = await createToken(userDoc.id, normalizedEmail);

    return res.status(200).json({
      ok: true,
      data: {
        userId: userDoc.id,
        email: normalizedEmail,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        token,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Server error. Please try again." });
  }
}
