// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Use whichever env var name you already use in vsai-create.ts
const VSAI_API_KEY =
  process.env.VSAI_API_KEY ||
  process.env.VIRTUALSTAGINGAI_API_KEY ||
  process.env.VSAI_KEY;

type Resp =
  | {
      ok: true;
      data: {
        paid: boolean;
        jobId: string | null;
        selectedUrl: string | null;
        selectedIndex: number | null;
        receiptUrl: string | null;
        invoiceUrl: string | null;
        customerEmail: string | null;
      };
    }
  | { ok: false; error: string; raw?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ ok: false, error: "STRIPE_SECRET_KEY is not set." });
  }

  try {
    const { session_id } = req.body as { session_id?: string };
    if (!session_id) return res.status(400).json({ ok: false, error: "session_id is required" });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "payment_intent.latest_charge"],
    });

    const paid = session.payment_status === "paid";
    if (!paid) return res.status(400).json({ ok: false, error: "Payment not completed.", raw: session });

    const meta: any = session.metadata || {};
    const jobId: string | null = meta.jobId || null;

    const selectedIndexRaw = meta.selectedIndex;
    const selectedIndex =
      typeof selectedIndexRaw === "string" ? Number(selectedIndexRaw) : 0;

    const customerEmail = session.customer_details?.email || null;

    // Receipt URL
    let receiptUrl: string | null = null;
    const pi = session.payment_intent as any;
    if (pi?.latest_charge?.receipt_url) receiptUrl = pi.latest_charge.receipt_url;

    // One-time Checkout usually has no invoice url
    const invoiceUrl = (session as any)?.invoice?.hosted_invoice_url || null;

    // ✅ Reconstruct the correct image URL from VSAI using jobId + selectedIndex
    let selectedUrl: string | null = null;

    if (!jobId) {
      return res.status(200).json({
        ok: true,
        data: {
          paid,
          jobId: null,
          selectedUrl: null,
          selectedIndex,
          receiptUrl,
          invoiceUrl,
          customerEmail,
        },
      });
    }

    if (!VSAI_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing VSAI API key env var (VSAI_API_KEY)." });
    }

    const qs = new URLSearchParams({
      include_variations: "true",
      variations_order: "asc",
      variations_limit: "100",
    });

    const vsaiResp = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(jobId)}?${qs.toString()}`,
      {
        headers: {
          // Docs specify "Api-Key ${key}" format. :contentReference[oaicite:1]{index=1}
          Authorization: `Api-Key ${VSAI_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    const vsaiJson: any = await vsaiResp.json().catch(() => ({}));
    const items: any[] = vsaiJson?.variations?.items || [];

    // Each variation has: result: { url, optimized_url, thumbnail_url } :contentReference[oaicite:2]{index=2}
    selectedUrl = items?.[selectedIndex]?.result?.url || items?.[0]?.result?.url || null;

    return res.status(200).json({
      ok: true,
      data: {
        paid,
        jobId,
        selectedUrl,
        selectedIndex,
        receiptUrl,
        invoiceUrl,
        customerEmail,
      },
    });
  } catch (err: any) {
    console.error("[post-checkout] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal server error" });
  }
}
