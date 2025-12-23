// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;
const VSAI_BASE = "https://api.virtualstagingai.app/v2";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM; // e.g. +1XXXXXXXXXX

type Resp =
  | {
      ok: true;
      data: {
        paid: boolean;
        jobId: string | null;
        selectedIndex: number | null;
        selectedUrl: string | null;
        receiptUrl: string | null;
        invoiceUrl: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        smsSent: boolean;
      };
    }
  | { ok: false; error: string; raw?: any };

function getBaseUrl(req: NextApiRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    (req.headers["x-forwarded-protocol"] as string) ||
    "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return `${proto}://${host}`;
}

function looksLikeUrl(v: any) {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

function extractVariationUrls(renderJson: any): string[] {
  // Handles several possible shapes defensively
  const v =
    renderJson?.variations?.items ||
    renderJson?.variations ||
    renderJson?.data?.variations?.items ||
    renderJson?.data?.variations ||
    [];

  const arr = Array.isArray(v) ? v : [];

  const urls: string[] = [];
  for (const item of arr) {
    const candidates = [
      item?.result?.url,
      item?.result_url,
      item?.output?.url,
      item?.output_url,
      item?.outputs?.[0]?.url,
      item?.outputs?.[0],
      item?.url,
    ];

    const found = candidates.find(looksLikeUrl);
    if (found && !urls.includes(found)) urls.push(found);
  }
  return urls;
}

async function fetchVsaiRender(renderId: string) {
  if (!VSAI_API_KEY) throw new Error("VSAI_API_KEY is not set.");

  // include_variations is the key for selection by index
  const url = `${VSAI_BASE}/renders/${encodeURIComponent(
    renderId
  )}?include_variations=true&variations_order=asc&variations_limit=200`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Api-Key ${VSAI_API_KEY}`,
    },
  });

  const text = await resp.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  if (!resp.ok) {
    throw new Error(json?.message || json?.error || `VSAI error ${resp.status}`);
  }

  return json;
}

async function sendTwilioSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) return false;

  const auth = Buffer.from(
    `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
  ).toString("base64");

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

  return resp.ok;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!STRIPE_SECRET_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "STRIPE_SECRET_KEY is not set." });
  }

  try {
    const { session_id } = req.body as { session_id?: string };
    if (!session_id) {
      return res.status(400).json({ ok: false, error: "session_id is required" });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

    const paid = (session as any)?.payment_status === "paid";
    if (!paid) {
      return res
        .status(400)
        .json({ ok: false, error: "Payment not completed.", raw: session });
    }

    const meta: any = session.metadata || {};
    const jobId: string | null = meta.jobId || null;

    const selectedIndexRaw = meta.selectedIndex;
    const selectedIndex =
      typeof selectedIndexRaw === "string" ? Number(selectedIndexRaw) : 0;

    const customerEmail = session.customer_details?.email || null;
    const customerPhone = session.customer_details?.phone || null;

    // Receipt URL (safe with expanded latest_charge)
    let receiptUrl: string | null = null;
    const pi = session.payment_intent as any;
    if (pi?.latest_charge?.receipt_url) receiptUrl = pi.latest_charge.receipt_url;

    const invoiceUrl = (session as any)?.invoice?.hosted_invoice_url || null;

    // ✅ Get the correct selected image from VSAI by index
    let selectedUrl: string | null = null;
    if (jobId) {
      const renderJson = await fetchVsaiRender(jobId);
      const urls = extractVariationUrls(renderJson);

      if (urls.length > 0) {
        const idx =
          Number.isFinite(selectedIndex) && selectedIndex >= 0
            ? Math.min(selectedIndex, urls.length - 1)
            : urls.length - 1;
        selectedUrl = urls[idx] || urls[urls.length - 1] || null;
      }
    }

    // Optional SMS (send a link to the success page, not the long image url)
    let smsSent = false;
    const baseUrl = getBaseUrl(req);

    const alreadySent = (session.metadata as any)?.smsSent === "1";
    if (!alreadySent && customerPhone && paid) {
      const successLink = `${baseUrl}/success?session_id=${encodeURIComponent(
        session_id
      )}`;
      const msg = `IconicVirtual.AI: Payment received ✅ Your download is ready: ${successLink}`;

      smsSent = await sendTwilioSms(customerPhone, msg).catch(() => false);

      // mark sent (best-effort)
      if (smsSent) {
        try {
          await stripe.checkout.sessions.update(session_id, {
            metadata: { ...meta, smsSent: "1" },
          });
        } catch {
          // ignore
        }
      }
    }

    return res.status(200).json({
      ok: true,
      data: {
        paid: true,
        jobId,
        selectedIndex: Number.isFinite(selectedIndex) ? selectedIndex : 0,
        selectedUrl,
        receiptUrl,
        invoiceUrl,
        customerEmail,
        customerPhone,
        smsSent,
      },
    });
  } catch (err: any) {
    console.error("[post-checkout] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
