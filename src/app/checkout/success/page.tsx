import type { Metadata } from "next";
import Link from "next/link";
import { ClearPaidCart } from "@/components/clear-paid-cart";
import { fulfillPaidCheckout } from "@/lib/orders/fulfillment";
import { stripe } from "@/lib/stripe/server";

export const metadata: Metadata = { title: "Order received", robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;
  let preparing = false;
  let testMode = false;
  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";
      if (paid) {
        const result = await fulfillPaidCheckout(session.id);
        preparing = result.fulfilled || result.reason === "fulfillment_in_progress";
        testMode = result.reason === "test_mode";
      }
    } catch (reason) {
      console.error("[checkout/success] confirmation failed", reason instanceof Error ? reason.message : "unknown");
    }
  }

  if (!paid) return <main className="checkout-success"><span aria-hidden="true">!</span><p>Payment confirmation pending</p><h1>We&apos;re still checking your payment.</h1><p>Your cart has not been cleared. If you completed payment, wait a moment and refresh this page or check your account.</p><div><Link href="/account" className="button button-dark">Check your orders</Link><Link href="/checkout" className="text-link">Return to checkout →</Link></div></main>;

  return <main className="checkout-success"><ClearPaidCart /><span aria-hidden="true">✓</span><p>{testMode ? "Test payment confirmed" : "Payment confirmed"}</p><h1>Thank you for your order.</h1><p>{testMode ? "This was a Stripe test-mode payment, so no real Printify order was created and no production cost was charged." : preparing ? "Your order has been securely passed to Printify and is being prepared for production. Live production and tracking updates are available in your account." : "Your payment is confirmed and production preparation is continuing automatically. Live updates are available in your account."}</p><div><Link href="/account" className="button button-dark">{testMode ? "View test order" : "Track your order"}</Link><Link href="/#shop" className="text-link">Continue shopping →</Link></div></main>;
}
