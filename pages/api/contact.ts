import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebaseAdmin";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_SMTP_USER, pass: process.env.GMAIL_SMTP_APP_PASSWORD },
});

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
    const fullName = ((firstName || "") + " " + (lastName || "")).trim() || "Website Visitor";

    await db.collection("contactMessages").add({
      firstName: (firstName || "").trim(),
      lastName: (lastName || "").trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: now,
      status: "new",
    });

    // Notify admin
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
      to: "virtualstaging@iconicvirtual.ai",
      replyTo: email.trim(),
      subject: "New Contact Form Message from " + fullName,
      html: "<h3>New Contact Form Submission</h3><p><strong>From:</strong> " + fullName + " (" + email.trim() + ")</p><p><strong>Message:</strong></p><p>" + message.trim() + "</p>",
    });

    // Confirmation to user
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
      to: email.trim(),
      subject: "We received your message - IconicVirtual.AI",
      html: "<div style=\"font-family:sans-serif;max-width:600px;margin:0 auto\"><h2>Thanks for reaching out, " + (firstName || "there").trim() + "!</h2><p>We received your message and will get back to you within 24 hours.</p><p style=\"color:#6b7280;font-size:14px\">Your message: " + message.trim() + "</p><p>- The IconicVirtual.AI Team</p></div>",
    });

    return res.status(200).json({ ok: true, message: "Message received" });
  } catch (err: any) {
    console.error("Contact form error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message" });
  }
}
