import type Stripe from "stripe";
import { db } from "./firebaseAdmin";
import {
  productForPaidCheckout,
  type CatalogProduct,
} from "./catalog";

const admin = require("firebase-admin");

export type GrantResult = {
  status: "granted" | "already" | "pending" | "skipped";
  credits: number;
  planName: string | null;
  email: string | null;
  userId: string | null;
};

function emptyGrant(status: GrantResult["status"], email: string | null = null): GrantResult {
  return { status, credits: 0, planName: null, email, userId: null };
}

function normalizeEmail(email: string | null | undefined): string | null {
  const value = (email || "").trim().toLowerCase();
  return value || null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

function applyCreditIncrement(
  update: Record<string, any>,
  credits: number,
  category: CatalogProduct["category"]
) {
  if (category === "ai") {
    update.aiCreditsRemaining = admin.firestore.FieldValue.increment(credits);
    update.creditsRemaining = admin.firestore.FieldValue.increment(credits);
  } else {
    update.proImagesRemaining = admin.firestore.FieldValue.increment(credits);
  }
}

export async function grantCatalogCredits(input: {
  idempotencyKey: string;
  product: CatalogProduct;
  purchaseType: "one_time" | "subscription";
  userId?: string | null;
  email?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  source?: string | null;
  renewal?: boolean;
}): Promise<GrantResult> {
  const email = normalizeEmail(input.email);
  let userId = input.userId || null;
  if (!userId && email) userId = await findUserIdByEmail(email);

  const orderRef = db.collection("orders").doc(input.idempotencyKey);
  const now = new Date().toISOString();

  const status: GrantResult["status"] = await db.runTransaction(async (tx: any) => {
    const existing = await tx.get(orderRef);
    if (existing.exists && existing.data()?.fulfilled) {
      return "already";
    }

    const purchaseType = input.purchaseType;
    if (userId) {
      const userRef = db.collection("users").doc(userId);
      const userUpdate: Record<string, any> = { updatedAt: now };
      if (purchaseType === "subscription") {
        userUpdate.activePlan = input.product.name;
        userUpdate.planCategory = input.product.category;
        userUpdate.planCreditsPerMonth = input.product.credits;
        if (!input.renewal) userUpdate.planStartedAt = now;
        userUpdate.planRenewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      applyCreditIncrement(userUpdate, input.product.credits, input.product.category);
      tx.set(userRef, userUpdate, { merge: true });
    } else if (email) {
      const pendingRef = db.collection("pendingCredits").doc(email);
      const pending = await tx.get(pendingRef);
      const prev = pending.exists ? pending.data() || {} : {};
      const field = input.product.category === "ai" ? "aiCredits" : "proImages";
      tx.set(
        pendingRef,
        {
          email,
          aiCredits: prev.aiCredits || 0,
          proImages: prev.proImages || 0,
          [field]: (prev[field] || 0) + input.product.credits,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    const nextStatus: GrantResult["status"] = userId ? "granted" : email ? "pending" : "skipped";

    tx.set(
      orderRef,
      {
        orderId: input.idempotencyKey,
        userId: userId || null,
        customerEmail: email,
        type: purchaseType === "subscription" ? "plan_purchase" : "credit_purchase",
        planName: input.product.name,
        productId: input.product.id,
        category: input.product.category,
        credits: input.product.credits,
        amountTotal: input.amountTotal ?? null,
        currency: input.currency ?? null,
        paymentStatus: "paid",
        fulfilled: nextStatus === "granted" || nextStatus === "pending",
        pendingEmail: nextStatus === "pending" ? email : null,
        source: input.source || null,
        fulfilledAt: now,
        createdAt: existing.exists ? existing.data()?.createdAt || now : now,
        updatedAt: now,
      },
      { merge: true }
    );
    return nextStatus;
  });

  if (status === "granted" && userId) {
    await db.collection("activityLog").add({
      userId,
      type: "credit_purchase",
      description:
        input.purchaseType === "subscription"
          ? "Subscribed to " + input.product.name + " (+" + input.product.credits + " credits)"
          : "Purchased " + input.product.name + " (+" + input.product.credits + " credits)",
      credits: input.product.credits,
      planName: input.product.name,
      timestamp: now,
    });
  }

  return {
    status,
    credits: status === "skipped" ? 0 : input.product.credits,
    planName: input.product.name,
    email,
    userId,
  };
}

export async function grantFromCheckoutSession(
  session: Stripe.Checkout.Session,
  linePriceId?: string | null
): Promise<GrantResult> {
  if (session.payment_status !== "paid") {
    return emptyGrant("skipped", normalizeEmail(session.customer_details?.email || session.metadata?.email));
  }

  const product = productForPaidCheckout({
    mode: session.mode,
    amount_total: session.amount_total,
    metadata: session.metadata,
    linePriceId: linePriceId || null,
  });
  if (!product) {
    return emptyGrant("skipped", normalizeEmail(session.customer_details?.email || session.metadata?.email));
  }

  const meta = session.metadata || {};
  const purchaseType = meta.purchaseType === "subscription" || session.mode === "subscription"
    ? "subscription"
    : "one_time";

  return grantCatalogCredits({
    idempotencyKey: session.id,
    product,
    purchaseType,
    userId: meta.userId || null,
    email: session.customer_details?.email || meta.email || null,
    amountTotal: session.amount_total,
    currency: session.currency,
    source: meta.source || null,
  });
}

export async function grantFromRenewalInvoice(
  invoice: Stripe.Invoice,
  stripe: Stripe
): Promise<GrantResult> {
  const email = normalizeEmail(invoice.customer_email);
  if (invoice.billing_reason === "subscription_create") return emptyGrant("skipped", email);
  if (invoice.status !== "paid" || !invoice.id) return emptyGrant("skipped", email);

  const subRef = invoice.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subId) return emptyGrant("skipped", email);

  const subscription = await stripe.subscriptions.retrieve(subId);
  const meta = subscription.metadata || {};
  const priceId = subscription.items?.data?.[0]?.price?.id || meta.priceId || null;
  const product = productForPaidCheckout({
    mode: "subscription",
    amount_total: invoice.amount_paid,
    metadata: { ...meta, priceId: priceId || meta.priceId || "" },
    linePriceId: priceId,
  });
  if (!product) return emptyGrant("skipped", email);

  return grantCatalogCredits({
    idempotencyKey: invoice.id,
    product,
    purchaseType: "subscription",
    userId: meta.userId || null,
    email: email || meta.email || null,
    amountTotal: invoice.amount_paid,
    currency: invoice.currency,
    source: "subscription_renewal",
    renewal: true,
  });
}

export async function applyPendingCredits(userId: string, email: string): Promise<number> {
  const normalized = normalizeEmail(email);
  if (!normalized || !userId) return 0;
  const pendingRef = db.collection("pendingCredits").doc(normalized);
  const now = new Date().toISOString();
  let applied = 0;

  await db.runTransaction(async (tx: any) => {
    const snap = await tx.get(pendingRef);
    if (!snap.exists) return;
    const data = snap.data() || {};
    const ai = Number(data.aiCredits || 0);
    const pro = Number(data.proImages || 0);
    if (ai <= 0 && pro <= 0) return;
    const userRef = db.collection("users").doc(userId);
    const update: Record<string, any> = { updatedAt: now };
    if (ai > 0) applyCreditIncrement(update, ai, "ai");
    if (pro > 0) applyCreditIncrement(update, pro, "traditional");
    tx.set(userRef, update, { merge: true });
    tx.set(
      pendingRef,
      { aiCredits: 0, proImages: 0, appliedTo: userId, appliedAt: now },
      { merge: true }
    );
    applied = ai + pro;
  });

  return applied;
}
