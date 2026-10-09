export type CatalogCategory = "ai" | "traditional";
export type CheckoutMode = "payment" | "subscription";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  /** Amount charged by the public checkout (price_data). In cents. */
  amountCents: number;
  credits: number;
  category: CatalogCategory;
  /**
   * Public /checkout and /offers buttons. Homepage "membership" rows are
   * one-time charges today; do not flip them to subscription without a
   * product decision.
   */
  publicCheckoutMode: CheckoutMode;
  /** Logged-in dashboard checkout. Omitted when this pack is not sold there. */
  dashboardMode?: CheckoutMode;
  stripePriceId?: string;
};

export const CATALOG: CatalogProduct[] = [
  {
    id: "small-ai",
    name: "Small AI Pack",
    description: "10 AI staged photos",
    amountCents: 6000,
    credits: 10,
    category: "ai",
    publicCheckoutMode: "payment",
    dashboardMode: "payment",
    stripePriceId: "price_1SfpAJCRfvDEtw05sLJJV2l6",
  },
  {
    id: "medium-ai",
    name: "Medium AI Pack",
    description: "40 AI staged photos",
    amountCents: 18000,
    credits: 40,
    category: "ai",
    publicCheckoutMode: "payment",
    dashboardMode: "payment",
    stripePriceId: "price_1SfpB1CRfvDEtw05Ot05yIiM",
  },
  {
    id: "big-ai",
    name: "Big AI Pack",
    description: "85 AI staged photos",
    amountCents: 25500,
    credits: 85,
    category: "ai",
    publicCheckoutMode: "payment",
    dashboardMode: "payment",
    stripePriceId: "price_1SfpBoCRfvDEtw05CIjrT22M",
  },
  {
    id: "ai-starter",
    name: "AI Starter",
    description: "10 AI staged photos",
    amountCents: 3900,
    credits: 10,
    category: "ai",
    publicCheckoutMode: "payment",
    dashboardMode: "subscription",
    stripePriceId: "price_1SfomqCRfvDEtw05fsBsZSDo",
  },
  {
    id: "ai-premium",
    name: "AI Premium",
    description: "40 AI staged photos",
    amountCents: 7900,
    credits: 40,
    category: "ai",
    publicCheckoutMode: "payment",
    dashboardMode: "subscription",
    stripePriceId: "price_1SfoqnCRfvDEtw05LVaF8uM5",
  },
  {
    id: "ai-pro",
    name: "AI Pro",
    description: "160 AI staged photos",
    amountCents: 19900,
    credits: 160,
    category: "ai",
    publicCheckoutMode: "payment",
    dashboardMode: "subscription",
    stripePriceId: "price_1SforxCRfvDEtw052rdFBqmK",
  },
  {
    id: "single-room",
    name: "Single Room",
    description: "1 professionally staged image",
    amountCents: 1500,
    credits: 1,
    category: "traditional",
    publicCheckoutMode: "payment",
    dashboardMode: "payment",
    stripePriceId: "price_1SfpCgCRfvDEtw05OPv3bp4n",
  },
  {
    id: "small-property",
    name: "Small Property",
    description: "10 professionally staged images",
    amountCents: 12500,
    credits: 10,
    category: "traditional",
    publicCheckoutMode: "payment",
    dashboardMode: "payment",
    stripePriceId: "price_1SfpDMCRfvDEtw054NgbiHCe",
  },
  {
    id: "large-property",
    name: "Large Property",
    description: "20 professionally staged images",
    amountCents: 20000,
    credits: 20,
    category: "traditional",
    publicCheckoutMode: "payment",
    dashboardMode: "payment",
    stripePriceId: "price_1SfpDpCRfvDEtw05B5SLOA9I",
  },
  {
    id: "t-starter",
    name: "T Starter",
    description: "10 professionally staged images",
    amountCents: 9900,
    credits: 10,
    category: "traditional",
    publicCheckoutMode: "payment",
    dashboardMode: "subscription",
    stripePriceId: "price_1Sfow3CRfvDEtw05TKPIkgbZ",
  },
  {
    id: "t-premium",
    name: "T Premium",
    description: "20 professionally staged images",
    amountCents: 14900,
    credits: 20,
    category: "traditional",
    publicCheckoutMode: "payment",
    dashboardMode: "subscription",
    stripePriceId: "price_1Sfp7qCRfvDEtw05c4FxCYlG",
  },
  {
    id: "t-pro",
    name: "T Pro",
    description: "50 professionally staged images",
    amountCents: 29900,
    credits: 50,
    category: "traditional",
    publicCheckoutMode: "payment",
    dashboardMode: "subscription",
    stripePriceId: "price_1Sfp90CRfvDEtw0566rRv8QO",
  },
  {
    id: "ai-5",
    name: "AI Starter Pack",
    description: "5 AI staged photos",
    amountCents: 500,
    credits: 5,
    category: "ai",
    publicCheckoutMode: "payment",
  },
  {
    id: "ai-25",
    name: "AI Best Value Bundle",
    description: "25 AI staged photos",
    amountCents: 5000,
    credits: 25,
    category: "ai",
    publicCheckoutMode: "payment",
  },
  {
    id: "ai-50",
    name: "AI Agent Pro Pack",
    description: "50 AI staged photos",
    amountCents: 7500,
    credits: 50,
    category: "ai",
    publicCheckoutMode: "payment",
  },
  {
    id: "ai-100",
    name: "AI Brokerage Pack",
    description: "100 AI staged photos",
    amountCents: 10000,
    credits: 100,
    category: "ai",
    publicCheckoutMode: "payment",
  },
  {
    id: "pro-1",
    name: "Pro Single Room",
    description: "1 professionally staged image",
    amountCents: 1000,
    credits: 1,
    category: "traditional",
    publicCheckoutMode: "payment",
  },
  {
    id: "pro-5",
    name: "Pro 5-Room Bundle",
    description: "5 professionally staged images",
    amountCents: 4000,
    credits: 5,
    category: "traditional",
    publicCheckoutMode: "payment",
  },
  {
    id: "pro-10",
    name: "Pro 10-Room Bundle",
    description: "10 professionally staged images",
    amountCents: 7500,
    credits: 10,
    category: "traditional",
    publicCheckoutMode: "payment",
  },
];

/** One staged-image download from the studio. Not a credit pack. */
export const HD_DOWNLOAD_AMOUNT_CENTS = 500;

const BY_ID = new Map(CATALOG.map((product) => [product.id, product]));
const BY_PRICE = new Map(
  CATALOG.filter((product) => product.stripePriceId).map((product) => [
    product.stripePriceId as string,
    product,
  ])
);

export function getProduct(id: string | null | undefined): CatalogProduct | null {
  if (!id) return null;
  return BY_ID.get(String(id).trim()) || null;
}

export function getProductByStripePriceId(priceId: string | null | undefined): CatalogProduct | null {
  if (!priceId) return null;
  return BY_PRICE.get(String(priceId).trim()) || null;
}

/**
 * Public checkout looks up a product id only. credits and price on the
 * request are ignored so a buyer cannot change the amount.
 */
export function resolvePublicProduct(body: {
  productId?: unknown;
  planId?: unknown;
  credits?: unknown;
  price?: unknown;
}): CatalogProduct | null {
  const id = String(body?.productId || body?.planId || "").trim();
  if (!id) return null;
  return getProduct(id);
}

export function paidAmountMatchesProduct(
  product: CatalogProduct,
  amountTotal: number | null | undefined
): boolean {
  if (amountTotal == null) return false;
  return amountTotal === product.amountCents;
}

/**
 * Credits come from the server catalog, never from a client amount.
 * Public price_data checkouts must have been paid for the catalog amount.
 * Dashboard checkouts must use a Stripe Price ID in the catalog.
 */
export function productForPaidCheckout(session: {
  mode?: string | null;
  amount_total?: number | null;
  metadata?: Record<string, string> | null;
  linePriceId?: string | null;
}): CatalogProduct | null {
  const meta = session.metadata || {};
  const byPrice = getProductByStripePriceId(session.linePriceId || meta.priceId);
  const byId = getProduct(meta.productId || meta.plan_id || meta.planId);
  const product = byPrice || byId;
  if (!product || product.credits <= 0) return null;

  if (byPrice) return product;

  if (session.mode === "payment" || !session.mode) {
    if (!paidAmountMatchesProduct(product, session.amount_total)) return null;
  }
  return product;
}
