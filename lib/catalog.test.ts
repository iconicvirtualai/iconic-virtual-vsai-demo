import assert from "assert";
import {
  HD_DOWNLOAD_AMOUNT_CENTS,
  getProduct,
  paidAmountMatchesProduct,
  productForPaidCheckout,
  resolvePublicProduct,
} from "./catalog";

function testPublicCheckoutIgnoresClientPrice() {
  const product = resolvePublicProduct({
    productId: "small-ai",
    credits: "10",
    price: "1",
  });
  assert.ok(product);
  assert.strictEqual(product?.amountCents, 6000);
  assert.strictEqual(product?.credits, 10);
  assert.strictEqual(paidAmountMatchesProduct(product!, 100), false);
  assert.strictEqual(paidAmountMatchesProduct(product!, 6000), true);
}

function testUnknownProduct() {
  assert.strictEqual(resolvePublicProduct({ productId: "free", price: "1" }), null);
  assert.strictEqual(resolvePublicProduct({ credits: "10", price: "60" }), null);
}

function testOffersPlan() {
  const plan = resolvePublicProduct({ planId: "ai-5", price: "1" });
  assert.strictEqual(plan?.amountCents, 500);
  assert.strictEqual(plan?.credits, 5);
}

function testPaidSessionRejectsTamperedAmount() {
  const product = productForPaidCheckout({
    mode: "payment",
    amount_total: 100,
    metadata: { productId: "small-ai", credits: "9999" },
  });
  assert.strictEqual(product, null);

  const ok = productForPaidCheckout({
    mode: "payment",
    amount_total: 6000,
    metadata: { productId: "small-ai", credits: "1" },
  });
  assert.strictEqual(ok?.credits, 10);
}

function testDashboardPriceId() {
  const product = productForPaidCheckout({
    mode: "subscription",
    amount_total: 3900,
    metadata: { priceId: "price_1SfomqCRfvDEtw05fsBsZSDo", credits: "1" },
    linePriceId: "price_1SfomqCRfvDEtw05fsBsZSDo",
  });
  assert.strictEqual(product?.id, "ai-starter");
  assert.strictEqual(product?.credits, 10);
  assert.strictEqual(getProduct("not-a-pack"), null);
  assert.strictEqual(HD_DOWNLOAD_AMOUNT_CENTS, 500);
}

testPublicCheckoutIgnoresClientPrice();
testUnknownProduct();
testOffersPlan();
testPaidSessionRejectsTamperedAmount();
testDashboardPriceId();
console.log("catalog tests passed");
