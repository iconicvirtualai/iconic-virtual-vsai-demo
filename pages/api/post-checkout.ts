// pages/api/post-checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { db } from "../../lib/firebaseAdmin";

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

    // --- Resolve the selected variation image URL ---
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

    // --- Read the job record to get the real renderId ---
    // vsai-create.ts stores renderId on the job doc. The Stripe metadata has
    // jobId which equals renderId in most cases, but we read the doc to be safe.
    let renderId: string = jobId;
    let sourceImageUrl: string | null = null;
    let roomType: string | null = null;
    let style: string | null = null;

    try {
      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (jobSnap.exists) {
        const jobData = jobSnap.data();
        renderId = jobData?.renderId || jobId;
        sourceImageUrl = jobData?.source?.publicUrl || null;
        roomType = jobData?.room_type || null;
        style = jobData?.style || null;
      }
    } catch (jobReadErr) {
      console.error("[post-checkout] job read error:", jobReadErr);
      // Continue with jobId as fallback renderId
    }

    // Use the v2 variations list endpoint - same one vsai-variation.ts already
    // proves works with v1 renderIds. This fixes the v1/v2 mismatch: the old
    // code hit GET /v2/renders/{id}?include_variations=true which is the render
    // lookup endpoint. The variations list endpoint is more reliable.
    // Header casing matches vsai-create.ts and vsai-variation.ts exactly.
    const vsaiResp = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(renderId)}/variations`,
      {
        headers: {
          Authorization: `Api-Key ${VSAI_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    const vsaiJson: any = await vsaiResp.json().catch(() => ({}));

    // The variations list endpoint can return items at multiple nesting levels
    // (matching the extractFirstUrl pattern in vsai-variation.ts)
    const items: any[] =
      vsaiJson?.variations?.items ||
      vsaiJson?.variations ||
      vsaiJson?.items ||
      (Array.isArray(vsaiJson) ? vsaiJson : []);

    // Pick the variation at selectedIndex, fall back to first
    selectedUrl =
      items?.[selectedIndex]?.result?.url ||
      items?.[selectedIndex]?.result_url ||
      items?.[selectedIndex]?.url ||
      items?.[0]?.result?.url ||
      null;

    // --- Persist to Firestore ---
    const now = new Date().toISOString();

    // Update (or create) the order with final image URLs.
    // Uses merge:true so this works whether the webhook already created the
    // order doc or this call wins the race.
    try {
      const orderUpdate: Record<string, any> = {
        orderId: session_id,
        orderNumber: null,
        userId: null,
        accountId: null,
        customerEmail,
        customerPhone: session.customer_details?.phone || null,
        orderType: "ai_staging",
        paymentStatus: "paid",
        jobId,
        renderId,
        selectedIndex: Number.isFinite(selectedIndex) ? selectedIndex : 0,
        sourceImageUrl,
        previewImageUrl: null,
        selectedUrl,
        finalImageUrl: selectedUrl,
        downloadUrl: selectedUrl,
        roomType,
        style,
        stripeCheckoutSessionId: session_id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent as any)?.id || null,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        receiptUrl,
        paidAt: now,
        updatedAt: now,
        // createdAt set here; merge:true means it won't overwrite if webhook
        // already created the doc with its own createdAt
        createdAt: now,
      };

      if (selectedUrl) {
        orderUpdate.status = "completed";
        orderUpdate.completedAt = now;
      } else {
        orderUpdate.status = "paid_pending_final";
        orderUpdate.completedAt = null;
      }

      await db.collection("orders").doc(session_id).set(orderUpdate, { merge: true });
    } catch (orderErr) {
      console.error("[post-checkout] order write error:", orderErr);
      // Don't fail the response - user still needs their download
    }

    // Update job to paid_done with final URLs
    if (jobId) {
      try {
        const jobUpdate: Record<string, any> = {
          status: selectedUrl ? "paid_done" : "paid_pending_final",
          selectedIndex: Number.isFinite(selectedIndex) ? selectedIndex : 0,
          updatedAt: now,
        };
        if (selectedUrl) {
          jobUpdate.selectedFinalImageUrl = selectedUrl;
          jobUpdate.finalImageUrl = selectedUrl;
          jobUpdate.downloadUrl = selectedUrl;
        }
        await db.collection("jobs").doc(jobId).update(jobUpdate);
      } catch (jobErr) {
        console.error("[post-checkout] job update error:", jobErr);
      }
    }

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
