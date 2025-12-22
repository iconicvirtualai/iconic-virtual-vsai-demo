// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

// Twilio (optional but you want texts)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

type Resp =
  | {
      ok: true;
      data: {
        jobId: string | null;
        finalUrl: string | null;
        receiptUrl: string | null;
        phone: string | null;
        email: string | null;
      };
    }
  | { ok: false; error: string };

async function sendTwilioSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) return;

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", TWILIO_FROM_NUMBER);
  form.set("Body", body);

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("[twilio] sms failed", resp.status, json);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!stripe) {
    return res.status(500).json({ ok: false, error: "Stripe not configured." });
  }

  const session_id = (req.query.session_id || req.query.sessionId) as string | undefined;
  if (!session_id) {
    return res.status(400).json({ ok: false, error: "session_id is required" });
  }

  try {
    // Expand payment_intent.latest_charge to access receipt_url safely
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

const paid =
  session.status === "complete" &&
  (session.payment_status as any) !== "unpaid";


    if (!paid) {
      return res.status(400).json({ ok: false, error: "Payment not completed." });
    }

    const jobId = session.metadata?.jobId || null;
    const selectedUrl = session.metadata?.selectedUrl || null;

    // Receipt URL (safe typing)
    let receiptUrl: string | null = null;
    const pi = session.payment_intent as Stripe.PaymentIntent | null;

    if (pi && typeof pi !== "string") {
      const latestCharge = pi.latest_charge as Stripe.Charge | string | null;
      if (latestCharge && typeof latestCharge !== "string") {
        receiptUrl = latestCharge.receipt_url || null;
      }
    }

    const email = session.customer_details?.email || null;
    const phone = session.customer_details?.phone || null;

    const finalUrl = selectedUrl; // ✅ the exact image they purchased

    // Send SMS confirmation w/ download link
    if (phone && finalUrl) {
      const msg =
        `ICONICVIRTUAL.AI — Payment received ✅\n\nDownload your staged image:\n${finalUrl}` +
        (receiptUrl ? `\n\nReceipt:\n${receiptUrl}` : "");
      await sendTwilioSms(phone, msg);
    }

    return res.status(200).json({
      ok: true,
      data: { jobId, finalUrl, receiptUrl, phone, email },
    });
  } catch (err: any) {
    console.error("[post-checkout] error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
