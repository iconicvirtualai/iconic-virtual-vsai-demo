import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { firstName, lastName, email, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({ ok: false, error: "Email and message are required" });
  }

  try {
    const now = new Date().toISOString();

    await db.collection("contactMessages").add({
      firstName: (firstName || "").trim(),
      lastName: (lastName || "").trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: now,
      status: "new",
    });

    return res.status(200).json({ ok: true, message: "Message received" });
  } catch (err: any) {
    console.error("Contact form error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message" });
  }
}
