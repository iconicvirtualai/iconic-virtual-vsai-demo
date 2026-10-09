import { getStripeSecretKey, STRIPE_API_VERSION } from "./stripeServer";
import Stripe from "stripe";

export const stripe = new Stripe(getStripeSecretKey() || "sk_test_unset", {
  apiVersion: STRIPE_API_VERSION,
});
