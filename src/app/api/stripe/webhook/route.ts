import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { adminFirestore } from "@/lib/firebase/admin";
import { fulfillPaidCheckout } from "@/lib/orders/fulfillment";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

async function updateCheckoutOrder(session: Stripe.Checkout.Session, status: string) {
  const database = adminFirestore();
  await database.collection("orders").doc(session.id).set({
    status,
    paymentStatus: session.payment_status,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    customerDetails: session.customer_details ?? null,
    stripeShippingDetails: session.collected_information?.shipping_details ?? null,
    currency: session.currency?.toUpperCase() ?? "CAD",
    amountSubtotal: session.amount_subtotal ?? null,
    amountTotal: session.amount_total ?? null,
    totalDetails: session.total_details ?? null,
    updatedAt: new Date(),
    ...(status === "paid" ? { paidAt: new Date() } : {}),
  }, { merge: true });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!webhookSecret || !signature) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (reason) {
    console.error("[stripe/webhook] signature verification failed", reason);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    const database = adminFirestore();
    const eventRef = database.collection("stripeWebhookEvents").doc(event.id);
    if ((await eventRef.get()).exists) return NextResponse.json({ received: true, duplicate: true });

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        const currentSession = await stripe().checkout.sessions.retrieve(session.id);
        await updateCheckoutOrder(currentSession, "paid");
        await fulfillPaidCheckout(session.id);
      } else {
        await updateCheckoutOrder(session, "processing_payment");
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      await updateCheckoutOrder(event.data.object, "payment_failed");
    } else if (event.type === "checkout.session.expired") {
      await updateCheckoutOrder(event.data.object, "expired");
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        const orders = await database.collection("orders").where("stripePaymentIntentId", "==", paymentIntentId).limit(1).get();
        await Promise.all(orders.docs.map((order) => order.ref.set({ status: charge.refunded ? "refunded" : "partially_refunded", updatedAt: new Date() }, { merge: true })));
      }
    }

    await eventRef.set({ type: event.type, processedAt: new Date() });
    return NextResponse.json({ received: true });
  } catch (reason) {
    console.error("[stripe/webhook] processing failed", reason);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
