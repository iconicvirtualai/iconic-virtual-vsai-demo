import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import Twilio from "twilio";
import { getMailer } from "../../lib/mailer";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

type Resp =
  | { ok: true; data: { sent: boolean; reason?: string } }
  | { ok: false; error: string };

function firstNameFrom(fullName: string | null) {
  if (!fullName) return "there";
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || "there";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ ok: false, error: "Stripe not configured" });
  }

  const { session_id } = req.body as { session_id?: string };

  if (!session_id) {
    return res.status(400).json({ ok: false, error: "Missing session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        ok: false,
        error: "Session not paid yet (no delivery sent).",
      });
    }

    const metadata = (session.metadata || {}) as Record<string, string>;
    if (metadata.deliverySent === "1") {
      return res.status(200).json({
        ok: true,
        data: { sent: false, reason: "Already sent (deliverySent=1)" },
      });
    }

    const jobId = metadata.jobId || "";
    const renderId = metadata.renderId || "";
    const variationId = metadata.variationId || "";

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // We will link them back to the verified success page for the actual download
    const downloadPageUrl = `${baseUrl}/success?jobId=${encodeURIComponent(
      jobId
    )}&session_id=${encodeURIComponent(session.id)}`;

    // Try to resolve a direct image URL (optional)
    let directImageUrl: string | null = null;
    if (renderId && variationId) {
      try {
        const resp = await fetch(
          `${baseUrl}/api/vsai-variation-result?renderId=${encodeURIComponent(
            renderId
          )}&variationId=${encodeURIComponent(variationId)}`
        );
        const json: any = await resp.json().catch(() => ({}));
        if (resp.ok && json?.ok) directImageUrl = json?.data?.url || null;
      } catch {}
    }

    // Receipt URL
    let receiptUrl: string | null = null;
    if (session.payment_intent && typeof session.payment_intent === "string") {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
      receiptUrl = pi.charges?.data?.[0]?.receipt_url || null;
    }

    const toEmail = session.customer_details?.email || null;
    const toPhone = session.customer_details?.phone || null;
    const fullName = session.customer_details?.name || null;
    const firstName = firstNameFrom(fullName);

    // ----- EMAIL -----
    if (toEmail) {
      const mailer = getMailer();

      const imageLink = directImageUrl || downloadPageUrl;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
          <h2>Delivery Notification: IconicVirtual.AI</h2>
          <p>Hi ${firstName}!</p>

          <p>
            Thank you so much for choosing IconicVirtual.AI to enhance your images and online rep.
            We're so excited to be in business with you! Now - a few things.
          </p>

          <ol>
            <li>
              <strong>Your staged image can be downloaded here:</strong><br/>
              <a href="${imageLink}" style="display:inline-block; margin-top:8px; padding:10px 16px; background:#0f172a; color:#fff; text-decoration:none; border-radius:12px;">
                Download Your Staged Image
              </a>
            </li>
            <li style="margin-top:12px;">
              <strong>Your payment receipt can be downloaded here:</strong><br/>
              ${
                receiptUrl
                  ? `<a href="${receiptUrl}" style="display:inline-block; margin-top:8px; padding:10px 16px; background:#16a34a; color:#fff; text-decoration:none; border-radius:12px;">
                       Download Receipt
                     </a>`
                  : `<span style="color:#64748b;">Receipt link not available yet. You can also view it in Stripe.</span>`
              }
            </li>
            <li style="margin-top:12px;">
              Place your next order with our design team or virtually stage your own images with our AI and enjoy
              <strong>10% off</strong> with code: <strong>#IconicAI</strong> (expires 12/31/2025)
            </li>
          </ol>

          <p>Best of luck and we'll see ya next round!</p>

          <p>
            <strong>The IconicVirtual.AI Team</strong><br/>
            info@iconicvirtual.ai<br/>
            www.iconicvirtual.ai
          </p>

          <p style="font-size:12px; color:#64748b;">
            website | IG | FB | TikTok | Pinterest | YouTube<br/>
            @IconicVirtual.AI (2025) is affiliated with @Iconicimagestx (2016)
          </p>
        </div>
      `;

      await mailer.sendMail({
        from: `IconicVirtual.AI <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Delivery Notification: IconicVirtual.AI",
        html,
      });
    }

    // ----- SMS (Twilio) -----
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (toPhone && sid && token && from) {
      const twilio = Twilio(sid, token);

      const smsBody =
        `Hi ${firstName}! Thank you for your order. ` +
        `We have sent an email with details on your order to ${toEmail || "your email"}. ` +
        `Here is your staged image: ${directImageUrl || downloadPageUrl} ` +
        `Talk soon - IVAI`;

      await twilio.messages.create({
        from,
        to: toPhone,
        body: smsBody,
      });
    }

    // Mark sent (idempotent)
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...metadata,
        deliverySent: "1",
      },
    });

    return res.status(200).json({ ok: true, data: { sent: true } });
  } catch (err: any) {
    console.error("[post-checkout] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error" });
  }
}
