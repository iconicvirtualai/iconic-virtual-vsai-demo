// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion })
  : null;

// Optional (won't block response if missing)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

type Resp =
  | {
      ok: true;
      data: {
        jobId: string;
        selectedIndex: number;
        downloadUrl: string | null;
        receiptUrl: string | null;
        email: string | null;
        phone: string | null;
      };
    }
  | { ok: false; error: string };

async function sendSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) return;
  const twilio = await import("twilio");
  const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({ from: TWILIO_FROM, to, body });
}

async function sendEmail(to: string, subject: string, text: string) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return;
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  await transporter.sendMail({
    from: GMAIL_USER,
    to,
    subject,
    text,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ ok: false, error: "Stripe not configured on server." });
  }

  const session_id = req.query.session_id;
  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ ok: false, error: "session_id is required" });
  }

  try {
    // Expand payment_intent so we can fetch receipt URL reliably
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    const jobId = (session.metadata?.jobId || "").trim();
    const selectedIndex = Number(session.metadata?.selectedIndex || "0") || 0;

    if (!jobId) {
      return res.status(400).json({ ok: false, error: "Missing jobId in session metadata." });
    }

    const email = session.customer_details?.email || null;
    const phone = session.customer_details?.phone || null;

    // Receipt URL (works for one-time payments)
    let receiptUrl: string | null = null;
    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    if (pi?.id) {
      const piExpanded = await stripe.paymentIntents.retrieve(pi.id, {
        expand: ["latest_charge"],
      });
      const latestCharge = piExpanded.latest_charge as Stripe.Charge | null;
      receiptUrl = latestCharge?.receipt_url || null;
    }

    // --- Determine downloadUrl ---
    // We try:
    // 1) Your internal job endpoint which should know current final/watermarked
    // 2) If your job endpoint includes an array of variations, select by index
    let downloadUrl: string | null = null;

    try {
      const site =
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sites.iconicvirtual.ai";
      const jobResp = await fetch(`${site}/api/jobs/${encodeURIComponent(jobId)}`);
      const jobJson = await jobResp.json().catch(() => ({}));

      if (jobResp.ok && jobJson?.ok && jobJson?.data) {
        const j = jobJson.data;

        // If you later store variations server-side, support it:
        const variationUrls: string[] =
          j.variationUrls || j.variations || j.outputs || [];

        if (Array.isArray(variationUrls) && variationUrls.length > 0) {
          downloadUrl = variationUrls[selectedIndex] || variationUrls[variationUrls.length - 1] || null;
        } else {
          downloadUrl = j.final?.url || j.watermarked?.url || null;
        }
      }
    } catch (e) {
      console.warn("[post-checkout] failed to fetch job endpoint:", e);
    }

    // Send notifications (don’t block user if these fail)
    const msg = `Your IconicVirtual.AI staging is ready.\n\nDownload: ${
      downloadUrl || "Link unavailable"
    }\nReceipt: ${receiptUrl || "Not available"}`;

    try {
      if (phone) await sendSms(phone, msg);
    } catch (e) {
      console.warn("[post-checkout] SMS failed:", e);
    }

    try {
      if (email) await sendEmail(email, "Your staging is ready", msg);
    } catch (e) {
      console.warn("[post-checkout] Email failed:", e);
    }

    return res.status(200).json({
      ok: true,
      data: { jobId, selectedIndex, downloadUrl, receiptUrl, email, phone },
    });
  } catch (err: any) {
    console.error("[post-checkout] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "post-checkout failed" });
  }
}
