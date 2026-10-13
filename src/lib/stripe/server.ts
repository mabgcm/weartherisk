import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function stripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  stripeClient ??= new Stripe(secretKey, { appInfo: { name: "Can PrintStore", version: "0.1.0" } });
  return stripeClient;
}
