import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebaseAdmin";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_SMTP_USER, pass: process.env.GMAIL_SMTP_APP_PASSWORD },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const { firstName, lastName, email, phone, propertyAddress, roomCount, stylePreference, styleMode, budget, notes, photos } = req.body || {};

  if (!email) return res.status(400).json({ ok: false, error: "Email is required" });
  if (!propertyAddress) return res.status(400).json({ ok: false, error: "Property address is required" });
  if (!roomCount || Number(roomCount) < 1) return res.status(400).json({ ok: false, error: "Room count is required" });

  try {
    const now = new Date().toISOString();
    const normalizedEmail = email.trim().toLowerCase();

    // Create the pro order in proOrders collection
    const orderRef = await db.collection("proOrders").add({
      firstName: (firstName || "").trim(),
      lastName: (lastName || "").trim(),
      email: normalizedEmail,
      phone: (phone || "").trim(),
      propertyAddress: propertyAddress.trim(),
      roomCount: Number(roomCount),
      styleMode: styleMode || "overall",
      stylePreference: (stylePreference || "").trim(),
      photos: Array.isArray(photos) ? photos : [],
      budget: (budget || "").trim(),
      notes: (notes || "").trim(),
      status: "new",
      createdAt: now,
    });

    // Also create in orders collection for internal tracking
    await db.collection("orders").add({
      address: propertyAddress.trim(),
      room: "Pro Staging (" + Number(roomCount) + " rooms)",
      style: (stylePreference || "mixed").trim(),
      type: "pro_staging",
      status: "processing",
      notes: (notes || "").trim(),
      customerName: ((firstName || "") + " " + (lastName || "")).trim(),
      customerEmail: normalizedEmail,
      proOrderId: orderRef.id,
      photoCount: Number(roomCount),
      photos: Array.isArray(photos) ? photos : [],
      createdAt: now,
    });

    // Log activity
    await db.collection("activityLog").add({
      email: normalizedEmail,
      type: "order",
      description: "Pro staging order submitted - " + propertyAddress.trim() + " (" + roomCount + " rooms)",
      timestamp: now,
    });

    // Send confirmation email to user
    const userNameDisplay = (firstName || "").trim() || "there";
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: normalizedEmail,
        subject: "Your Pro Staging Order Has Been Received - IconicVirtual.AI",
        html: "<div style=\"font-family:sans-serif;max-width:600px;margin:0 auto\"><div style=\"background:#0a0a0a;padding:24px;text-align:center;border-radius:12px 12px 0 0\"><h1 style=\"color:#10b981;margin:0;font-size:24px\">IconicVirtual.AI</h1></div><div style=\"padding:32px;background:#fff;border:1px solid #e2e8f0;border-top:none\"><h2 style=\"margin-top:0\">Hi " + userNameDisplay + "!</h2><p>We have received your pro staging order and our design team is on it.</p><div style=\"background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0\"><p style=\"margin:4px 0\"><strong>Order ID:</strong> " + orderRef.id + "</p><p style=\"margin:4px 0\"><strong>Property:</strong> " + propertyAddress.trim() + "</p><p style=\"margin:4px 0\"><strong>Rooms:</strong> " + roomCount + "</p><p style=\"margin:4px 0\"><strong>Style:</strong> " + (stylePreference || "Designer choice") + "</p></div><p>We will reach out if we need any clarification. Expect your staged photos within 24 hours.</p></div><div style=\"padding:16px;text-align:center;font-size:12px;color:#9ca3af\"><p>2026 IconicVirtual.AI</p></div></div>",
      });
    } catch (emailErr) {
      console.error("User confirmation email failed:", emailErr);
    }

    // Notify admin with photo links
    try {
      const photoArray = Array.isArray(photos) ? photos : [];
      let photoHtml = "";
      if (photoArray.length > 0) {
        photoHtml = "<h4 style=\"margin-top:24px;margin-bottom:12px\">Submitted Photos (" + photoArray.length + ")</h4><table style=\"width:100%;border-collapse:collapse\">";
        photoArray.forEach((p: any, i: number) => {
          photoHtml += "<tr style=\"border-bottom:1px solid #e2e8f0\"><td style=\"padding:8px 0\"><strong>" + (i + 1) + ". " + (p.roomLabel || "Unlabeled") + "</strong>" + (p.style ? " (" + p.style + ")" : "") + "</td><td style=\"padding:8px 0;text-align:right\"><a href=\"" + (p.url || "#") + "\" style=\"color:#10b981;text-decoration:underline\" target=\"_blank\">Download</a></td></tr>";
        });
        photoHtml += "</table>";
      }
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_SMTP_USER,
        to: "virtualstaging@iconicvirtual.ai",
        subject: "New Pro Staging Order - " + propertyAddress.trim(),
        html: "<div style=\"font-family:sans-serif;max-width:600px\"><h3 style=\"color:#10b981\">New Pro Staging Order</h3><p><strong>Customer:</strong> " + (firstName || "") + " " + (lastName || "") + " (" + normalizedEmail + ")</p><p><strong>Phone:</strong> " + (phone || "N/A") + "</p><p><strong>Property:</strong> " + propertyAddress.trim() + "</p><p><strong>Rooms:</strong> " + roomCount + "</p><p><strong>Style:</strong> " + (stylePreference || "Designer choice") + "</p><p><strong>Budget:</strong> " + (budget || "Not specified") + "</p><p><strong>Notes:</strong> " + (notes || "None") + "</p><p><strong>Order ID:</strong> " + orderRef.id + "</p>" + photoHtml + "</div>",
      });
    } catch (emailErr) {
      console.error("Admin notification email failed:", emailErr);
    }

    return res.status(200).json({
      ok: true,
      orderId: orderRef.id,
      email: normalizedEmail,
      message: "Pro order submitted successfully",
    });
  } catch (err: any) {
    console.error("Pro order error:", err);
    return res.status(500).json({ ok: false, error: "Failed to submit order" });
  }
}
