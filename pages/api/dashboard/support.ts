// pages/api/dashboard/support.ts — Email support + support tickets + chat + referrals
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_SMTP_USER, pass: process.env.GMAIL_SMTP_APP_PASSWORD },
});
const ADMIN_EMAIL = "team@iconicimagestx.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });
  const userId = decoded.userId;
  const { action } = req.body || req.query;

  // Helper to get user info
  async function getUserInfo() {
    const snap = await db.collection("users").doc(userId).get();
    const data = snap.exists ? snap.data() : {};
    return {
      email: data?.email || decoded.email,
      name: ((data?.firstName || "") + " " + (data?.lastName || "")).trim() || "User",
    };
  }

  // ---- EMAIL SUPPORT (Send Email tab) ----
  if (req.method === "POST" && action === "email") {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ ok: false, error: "Subject and message required" });
    const now = new Date().toISOString();
    const user = await getUserInfo();
    try {
      await db.collection("supportEmails").add({ userId, email: user.email, name: user.name, subject, message, createdAt: now });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: ADMIN_EMAIL,
        replyTo: user.email,
        subject: "Email Support Submitted from: " + user.name,
        html: "<h3>Email Support Request</h3><p><strong>From:</strong> " + user.name + " (" + user.email + ")</p><p><strong>Subject:</strong> " + subject + "</p><p><strong>Message:</strong></p><p>" + message + "</p>",
      });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: user.email,
        subject: "We received your message - IconicVirtual.AI",
        html: "<div style=\"font-family:sans-serif;max-width:600px;margin:0 auto\"><h2>Thanks for reaching out, " + user.name + "!</h2><p>We received your email and will get back to you within 24 hours.</p><p style=\"color:#6b7280;font-size:14px\"><strong>Subject:</strong> " + subject + "</p><p style=\"color:#6b7280;font-size:14px\"><strong>Your message:</strong> " + message + "</p><p>- The IconicVirtual.AI Team</p></div>",
      });
      return res.status(201).json({ ok: true, message: "Email sent! We will respond within 24 hours." });
    } catch (err: any) {
      console.error("Email support error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ---- SUPPORT TICKET ----
  if (req.method === "POST" && action === "ticket") {
    const { subject, message, category } = req.body;
    if (!subject || !message) return res.status(400).json({ ok: false, error: "Subject and message required" });
    const now = new Date().toISOString();
    const user = await getUserInfo();
    const cat = category || "General";
    try {
      await db.collection("supportTickets").add({ userId, email: user.email, name: user.name, category: cat, subject, message, status: "open", createdAt: now });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: ADMIN_EMAIL,
        replyTo: user.email,
        subject: cat + " | " + subject + " | " + user.name,
        html: "<h3>Support Ticket Submitted</h3><p><strong>Category:</strong> " + cat + "</p><p><strong>Subject:</strong> " + subject + "</p><p><strong>From:</strong> " + user.name + " (" + user.email + ")</p><p><strong>Message:</strong></p><p>" + message + "</p>",
      });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: user.email,
        subject: "Support Ticket Received: " + subject + " - IconicVirtual.AI",
        html: "<div style=\"font-family:sans-serif;max-width:600px;margin:0 auto\"><h2>We received your support ticket</h2><p>Hi " + user.name + ", we have received your request and will respond as soon as possible.</p><div style=\"background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0\"><p style=\"margin:4px 0\"><strong>Category:</strong> " + cat + "</p><p style=\"margin:4px 0\"><strong>Subject:</strong> " + subject + "</p><p style=\"margin:4px 0\"><strong>Message:</strong> " + message + "</p></div><p>- The IconicVirtual.AI Team</p></div>",
      });
      return res.status(201).json({ ok: true, message: "Ticket submitted!" });
    } catch (err: any) {
      console.error("Support ticket error:", err);
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
      const user = await getUserInfo();
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: ADMIN_EMAIL,
        subject: "New chat message from " + user.name + " (" + user.email + ")",
        html: "<p><strong>" + user.name + " (" + user.email + "):</strong> " + message + "</p><p><a href=\"https://www.iconicvirtual.ai/admin/chat\">Open Admin Chat</a></p>",
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
    const user = await getUserInfo();
    try {
      const ref = await db.collection("referrals").add({ referrerId: userId, referredEmail: email.trim().toLowerCase(), status: "pending", creditsAwarded: false, createdAt: now });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: email.trim(),
        subject: user.name + " thinks you will love Iconic Virtual AI",
        html: "<h2>" + user.name + " invited you to Iconic Virtual AI!</h2><p>Sign up and you both get 10 free credits.</p><p><a href=\"https://www.iconicvirtual.ai/login?ref=" + ref.id + "\">Claim Your Free Credits</a></p>",
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
