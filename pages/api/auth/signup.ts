import type { NextApiRequest, NextApiResponse } from "next";

type Response = 
  | { ok: true; data: { userId: string; token: string; email: string } }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ ok: false, error: "Password must be at least 6 characters" });
  }

  try {
    const { db } = await import("../../../lib/firebaseAdmin");

    // Check if user already exists
    const usersCollection = db.collection("users");
    const existingSnapshot = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({ ok: false, error: "Email already registered" });
    }

    // Create new user
    const newUserRef = await usersCollection.add({
      email: email.toLowerCase(),
      password, // In production, hash this with bcrypt
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(201).json({
      ok: true,
      data: {
        userId: newUserRef.id,
        email,
        token: Buffer.from(`${newUserRef.id}:${Date.now()}`).toString("base64"),
      },
    });
  } catch (err: any) {
    console.error("Signup error:", err);

    // If Firestore not configured, still allow demo signup
    if (err?.message?.includes("Firebase")) {
      const demoUserId = `user_${email.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}`;
      return res.status(201).json({
        ok: true,
        data: {
          userId: demoUserId,
          email,
          token: Buffer.from(`${demoUserId}:${Date.now()}`).toString("base64"),
        },
      });
    }

    return res.status(500).json({ ok: false, error: "Signup failed" });
  }
}
