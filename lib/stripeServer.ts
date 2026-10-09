import Stripe from "stripe";
import type { NextApiRequest } from "next";

export const STRIPE_API_VERSION = "2024-06-20" as const;

/**
 * Preview deploys use a test secret when one is configured.
 * Production keeps STRIPE_SECRET_KEY.
 *
 * Accepted Preview names, first match wins:
 * STRIPE_TEST_SECRET_KEY, STRIPE_SECRET_KEY_TEST
 */
export function getStripeSecretKey(): string {
  if (process.env.VERCEL_ENV === "preview") {
    const testKey =
      process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY_TEST;
    if (testKey) return testKey;
  }
  return process.env.STRIPE_SECRET_KEY || "";
}

/**
 * Preview webhook signing secret, first match wins:
 * STRIPE_TEST_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET_TEST
 */
export function getStripeWebhookSecret(): string {
  if (process.env.VERCEL_ENV === "preview") {
    const testSecret =
      process.env.STRIPE_TEST_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET_TEST;
    if (testSecret) return testSecret;
  }
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export function getStripe(): Stripe {
  const key = getStripeSecretKey();
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

export function stripeKeyEnvName(): string {
  if (process.env.VERCEL_ENV === "preview") {
    if (process.env.STRIPE_TEST_SECRET_KEY) return "STRIPE_TEST_SECRET_KEY";
    if (process.env.STRIPE_SECRET_KEY_TEST) return "STRIPE_SECRET_KEY_TEST";
  }
  return "STRIPE_SECRET_KEY";
}

type HeaderValue = string | string[] | undefined;

function header(req: NextApiRequest, name: string): string {
  const value = req.headers[name] as HeaderValue;
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

/**
 * Preview success/cancel URLs stay on the preview host so a test purchase
 * does not bounce to production. Production uses NEXT_PUBLIC_SITE_URL.
 */
export function getPublicSiteUrl(req?: NextApiRequest): string {
  if (process.env.VERCEL_ENV === "preview" && req) {
    const proto = header(req, "x-forwarded-proto") || "https";
    const host = header(req, "x-forwarded-host") || header(req, "host");
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (req) {
    const proto = header(req, "x-forwarded-proto") || "https";
    const host = header(req, "x-forwarded-host") || header(req, "host");
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }
  return "https://www.iconicvirtual.ai";
}
