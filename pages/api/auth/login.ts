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

  try {
    const { db } = await import("../../../lib/firebaseAdmin");

    // Query Firestore for user
    const usersCollection = db.collection("users");
    const snapshot = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ ok: false, error: "Invalid email or password" });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Simple password comparison (in production, use bcrypt for hashed passwords)
    if (userData.password !== password) {
      return res.status(401).json({ ok: false, error: "Invalid email or password" });
    }

    // Return user info
    return res.status(200).json({
      ok: true,
      data: {
        userId: userDoc.id,
        email: userData.email,
        token: Buffer.from(`${userDoc.id}:${Date.now()}`).toString("base64"),
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    
    // If Firestore not configured, still allow demo login
    if (err?.message?.includes("Firebase")) {
      const demoUserId = `user_${email.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}`;
      return res.status(200).json({
        ok: true,
        data: {
          userId: demoUserId,
          email,
          token: Buffer.from(`${demoUserId}:${Date.now()}`).toString("base64"),
        },
      });
    }

    return res.status(500).json({ ok: false, error: "Authentication failed" });
  }
}
