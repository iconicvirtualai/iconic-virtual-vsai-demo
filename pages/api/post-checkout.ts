// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM; // must be your Twilio number

type Resp =
  | { ok: true; data: { finalUrl: string; receiptUrl: string | null } }
  | { ok: false; error: string };

async function sendSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) return;

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
    "base64"
  );

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", TWILIO_FROM);
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
    console.error("[twilio] send failed:", resp.status, json);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!stripe) {
    return res
      .status(500)
      .json({ ok: false, error: "Stripe is not configured on the server." });
  }
  if (!VSAI_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "VSAI_API_KEY is not set on the server." });
  }

  const { session_id } = req.body as { session_id?: string };
  if (!session_id) {
    return res.status(400).json({ ok: false, error: "session_id is required" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const jobId = session.metadata?.jobId || null;
    const selectedIndex = Number(session.metadata?.selectedIndex || "0");

    if (!jobId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing jobId in Stripe metadata." });
    }

    // Receipt URL (modern Stripe types)
    let receiptUrl: string | null = null;
    if (session.payment_intent) {
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;

      const pi = await stripe.paymentIntents.retrieve(piId);

      const chargeId =
        typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : pi.latest_charge?.id;

      if (chargeId) {
        const ch = await stripe.charges.retrieve(chargeId);
        receiptUrl = (ch.receipt_url as string) || null;
      }
    }

    // Get render outputs so we can return the *correct* image
    const vsaiRes = await fetch(
      `${VSAI_BASE}/render?render_id=${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: { Authorization: `Api-Key ${VSAI_API_KEY}` },
      }
    );

    const render: any = await vsaiRes.json().catch(() => ({}));
    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: render?.error || render?.message || "Failed to fetch render",
      });
    }

    const outputsRaw = Array.isArray(render?.outputs) ? render.outputs : [];
    const outputs = outputsRaw.filter(
      (u: any, i: number) => typeof u === "string" && outputsRaw.indexOf(u) === i
    );

    const safeIndex =
      Number.isFinite(selectedIndex) && selectedIndex >= 0
        ? Math.min(selectedIndex, Math.max(0, outputs.length - 1))
        : Math.max(0, outputs.length - 1);

    const finalUrl = outputs[safeIndex] || outputs[outputs.length - 1];

    if (!finalUrl) {
      return res.status(500).json({
        ok: false,
        error: "No output image found for this render yet.",
      });
    }

    const toPhone = session.customer_details?.phone || null;

    // Send SMS if possible (Twilio trial requires verified To numbers)
    if (toPhone) {
      await sendSms(
        toPhone,
        `Your IconicVirtual.AI staged image is ready: ${finalUrl}`
      );
    } else {
      console.warn("[post-checkout] No phone found on session.customer_details");
    }

    return res.status(200).json({
      ok: true,
      data: { finalUrl, receiptUrl },
    });
  } catch (err: any) {
    console.error("[post-checkout] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || "Post-checkout failed." });
  }
}
