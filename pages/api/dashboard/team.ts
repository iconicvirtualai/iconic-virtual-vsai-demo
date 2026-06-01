// pages/api/dashboard/team.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_SMTP_USER, pass: process.env.GMAIL_SMTP_APP_PASSWORD },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });
  const userId = decoded.userId;

  if (req.method === "GET") {
    try {
      const snap = await db.collection("teamInvites").where("invitedBy", "==", userId).get();
      const members: any[] = [];
      snap.forEach((doc: any) => members.push({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ ok: true, members });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    const { email, role } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: "Email required" });
    const validRoles = ["admin", "editor", "viewer"];
    const memberRole = validRoles.includes(role) ? role : "viewer";
    const now = new Date().toISOString();
    try {
      const userSnap = await db.collection("users").doc(userId).get();
      const inviterName = userSnap.exists ? (userSnap.data()?.firstName || "A team member") : "A team member";
      const invite = { invitedBy: userId, email: email.trim().toLowerCase(), role: memberRole, status: "pending", createdAt: now };
      const ref = await db.collection("teamInvites").add(invite);
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: email.trim(),
        subject: inviterName + " invited you to join Iconic Virtual AI",
        html: "<h2>You have been invited!</h2><p>" + inviterName + " has invited you to join their team on Iconic Virtual AI as a <strong>" + memberRole + "</strong>.</p><p><a href=\"https://www.iconicvirtual.ai/login?invite=" + ref.id + "\">Accept Invitation</a></p>",
      });
      return res.status(201).json({ ok: true, invite: { id: ref.id, ...invite } });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { memberId } = req.body || {};
    if (!memberId) return res.status(400).json({ ok: false, error: "memberId required" });
    try {
      const ref = db.collection("teamInvites").doc(memberId);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: "Not found" });
      if (snap.data()?.invitedBy !== userId) return res.status(403).json({ ok: false, error: "Not authorized" });
      await ref.delete();
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
