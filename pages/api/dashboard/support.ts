// pages/api/dashboard/support.ts — Chat messages + support tickets + referrals
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_SMTP_USER, pass: process.env.GMAIL_SMTP_APP_PASSWORD },
});
const admin = require("firebase-admin");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });
  const userId = decoded.userId;
  const { action } = req.body || req.query;

  // ---- SUPPORT TICKET ----
  if (req.method === "POST" && action === "ticket") {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ ok: false, error: "Subject and message required" });
    const now = new Date().toISOString();
    const userSnap = await db.collection("users").doc(userId).get();
    const userEmail = userSnap.exists ? userSnap.data()?.email : decoded.email;
    const userName = userSnap.exists ? (userSnap.data()?.firstName + " " + userSnap.data()?.lastName).trim() : "User";
    try {
      await db.collection("supportTickets").add({ userId, email: userEmail, name: userName, subject, message, status: "open", createdAt: now });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: "virtualstaging@iconicvirtual.ai",
        replyTo: userEmail,
        subject: "Support Ticket: " + subject,
        html: "<p><strong>From:</strong> " + userName + " (" + userEmail + ")</p><p>" + message + "</p>",
      });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: userEmail,
        subject: "We received your support request: " + subject,
        html: "<h3>Thank you for contacting Iconic Virtual AI</h3><p>We received your support ticket and will respond within 24 hours.</p><p><strong>Subject:</strong> " + subject + "</p><p><strong>Message:</strong> " + message + "</p>",
      });
      return res.status(201).json({ ok: true, message: "Ticket submitted!" });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ---- CHAT MESSAGE ----
  if (req.method === "POST" && action === "chat") {
    const { message } = req.body;
    if (!message) return res.status(400).json({ ok: false, error: "Message required" });
    const now = new Date().toISOString();
    try {
      await db.collection("supportChats").doc(userId).collection("messages").add({ sender: "user", message, timestamp: now });
      // Notify admin via email
      const userSnap = await db.collection("users").doc(userId).get();
      const userEmail = userSnap.exists ? userSnap.data()?.email : "";
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: "virtualstaging@iconicvirtual.ai",
        subject: "New chat message from " + userEmail,
        html: "<p><strong>" + userEmail + ":</strong> " + message + "</p><p><a href=\"https://www.iconicvirtual.ai/admin/chat\">Open Admin Chat</a></p>",
      }).catch(function() {});
      return res.status(201).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ---- GET CHAT MESSAGES ----
  if (req.method === "GET" && action === "chat") {
    try {
      const snap = await db.collection("supportChats").doc(userId).collection("messages").get();
      const messages: any[] = [];
      snap.forEach((doc: any) => messages.push({ id: doc.id, ...doc.data() }));
      messages.sort((a: any, b: any) => (a.timestamp || "").localeCompare(b.timestamp || ""));
      return res.status(200).json({ ok: true, messages });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ---- REFERRAL ----
  if (req.method === "POST" && action === "referral") {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: "Email required" });
    const now = new Date().toISOString();
    const userSnap = await db.collection("users").doc(userId).get();
    const referrerName = userSnap.exists ? (userSnap.data()?.firstName || "Someone") : "Someone";
    try {
      const ref = await db.collection("referrals").add({ referrerId: userId, referredEmail: email.trim().toLowerCase(), status: "pending", creditsAwarded: false, createdAt: now });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: email.trim(),
        subject: referrerName + " thinks you will love Iconic Virtual AI",
        html: "<h2>" + referrerName + " invited you to Iconic Virtual AI!</h2><p>Sign up and you both get 10 free credits.</p><p><a href=\"https://www.iconicvirtual.ai/login?ref=" + ref.id + "\">Claim Your Free Credits</a></p>",
      });
      return res.status(201).json({ ok: true, message: "Referral sent!" });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ---- GET REFERRALS ----
  if (req.method === "GET" && action === "referrals") {
    try {
      const snap = await db.collection("referrals").where("referrerId", "==", userId).get();
      const referrals: any[] = [];
      snap.forEach((doc: any) => referrals.push({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ ok: true, referrals });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
