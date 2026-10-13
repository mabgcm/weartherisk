import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { adminFirestore, verifyFirebaseToken } from "@/lib/firebase/admin";
import { getPrintifyProduct } from "@/lib/printify/client";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

interface CheckoutItemInput { productId: string; variantId: number; quantity: number }
function validItems(value: unknown): value is CheckoutItemInput[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 20 && value.every((item) =>
    typeof item === "object" && item !== null
    && typeof item.productId === "string" && item.productId.length > 0
    && Number.isInteger(item.variantId)
    && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10,
  );
}

export async function POST(request: Request) {
  try {
    const user = await verifyFirebaseToken(request);
    if (!user?.uid || !user.email) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

    const body = await request.json() as { items?: unknown };
    if (!validItems(body.items)) return NextResponse.json({ error: "The checkout details are incomplete or invalid." }, { status: 400 });

    const productIds = [...new Set(body.items.map((item) => item.productId))];
    const products = await Promise.all(productIds.map((productId) => getPrintifyProduct(productId)));
    const productMap = new Map(products.map((product) => [product.id, product]));
    const validatedItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      const variant = product?.variants.find((candidate) => candidate.id === item.variantId && candidate.is_enabled && candidate.is_available);
      if (!product?.visible || !variant || !Number.isInteger(variant.price) || variant.price <= 0) throw new Error("CART_ITEM_UNAVAILABLE");
      const image = product.images.find((candidate) => candidate.is_default)?.src ?? product.images[0]?.src;
      return { ...item, title: product.title, variantTitle: variant.title, unitAmount: variant.price, image };
    });
    const subtotal = validatedItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const shippingAmount = subtotal >= 7500 ? 0 : 799;
    const siteUrl = new URL(request.url).origin;
    const metadata = { firebase_uid: user.uid };
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "cad",
        unit_amount: item.unitAmount,
        tax_behavior: "exclusive",
        product_data: {
          name: item.title,
          description: item.variantTitle,
          images: item.image ? [item.image] : undefined,
          tax_code: "txcd_99999999",
          metadata: { printify_product_id: item.productId, printify_variant_id: String(item.variantId) },
        },
      },
    }));
    const rawIdempotencyKey = request.headers.get("idempotency-key") ?? "";
    const fallbackKey = createHash("sha256").update(`${user.uid}:${JSON.stringify(body.items)}:${Math.floor(Date.now() / 60000)}`).digest("hex");
    const idempotencyKey = /^[a-zA-Z0-9_-]{16,200}$/.test(rawIdempotencyKey) ? rawIdempotencyKey : fallbackKey;

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      adaptive_pricing: { enabled: true },
      integration_identifier: `canprint_${Array.from(randomBytes(8), (value) => String.fromCharCode(97 + value % 26)).join("")}`,
      line_items: lineItems,
      client_reference_id: user.uid,
      customer_email: user.email,
      customer_creation: "always",
      shipping_address_collection: { allowed_countries: ["CA", "US"] },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: true },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: shippingAmount === 0 ? "Free standard shipping" : "Standard shipping",
          fixed_amount: { amount: shippingAmount, currency: "cad" },
          tax_behavior: "exclusive",
          tax_code: "txcd_92010001",
          delivery_estimate: { minimum: { unit: "business_day", value: 5 }, maximum: { unit: "business_day", value: 10 } },
        },
      }],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=1`,
      after_expiration: { recovery: { enabled: true } },
    }, { idempotencyKey });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    await adminFirestore().collection("orders").doc(session.id).set({
      userId: user.uid,
      email: user.email,
      status: "pending_payment",
      currency: "CAD",
      subtotal,
      shippingTotal: shippingAmount,
      total: subtotal + shippingAmount,
      stripeCheckoutSessionId: session.id,
      items: validatedItems.map(({ image, ...item }) => ({ ...item, image: image ?? "" })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ url: session.url });
  } catch (reason) {
    if (reason instanceof Error && reason.message === "CART_ITEM_UNAVAILABLE") {
      return NextResponse.json({ error: "One of the products in your bag is no longer available. Please refresh your bag." }, { status: 409 });
    }
    console.error("[api/checkout] session creation failed", reason);
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
