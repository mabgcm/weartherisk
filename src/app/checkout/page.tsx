"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth, useCart } from "@/components/providers";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })) }),
      });
      const responseText = await response.text();
      let data: { url?: string; error?: string } = {};
      if (responseText) {
        try { data = JSON.parse(responseText) as typeof data; }
        catch { console.error("[checkout] non-JSON response", { status: response.status, contentType: response.headers.get("content-type") }); }
      }
      if (!responseText) throw new Error(`Checkout server returned an empty response (${response.status}). Please try again.`);
      if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout could not be started.");
      window.location.assign(data.url);
    } catch (reason) {
      console.error("[checkout] payment start failed", reason);
      setError(reason instanceof Error ? reason.message : "Checkout could not be started. Please try again.");
      setBusy(false);
    }
  }

  if (authLoading) return <main className="min-h-[70vh] px-6 py-20 text-center">Loading checkout…</main>;
  if (!user) return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16"><div className="w-full rounded-[2rem] bg-white p-9 text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Checkout</p><h1 className="mt-3 text-3xl font-black">Sign in to complete your purchase</h1><p className="mt-4 leading-7 text-black/55">Your cart is saved. Sign in and we&apos;ll bring you right back here.</p><Link href="/login?next=/checkout" className="mt-8 inline-flex rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">Sign in</Link></div></main>;
  if (!items.length) return <main className="min-h-[70vh] px-6 py-24 text-center"><h1 className="text-3xl font-black">Your cart is empty</h1><Link href="/#shop" className="mt-5 inline-flex rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">Shop now</Link></main>;

  return <main className="checkout-page">
    <h1>Checkout</h1>
    {error && <p className="checkout-error" role="alert">{error}</p>}
    <form onSubmit={submit} className="checkout-layout">
      <section className="checkout-address">
        <header><div><small>Secure delivery</small><h2>Shipping details</h2></div></header>
        <p className="checkout-email">Signed in as {user.email}</p>
        <div className="mt-8 rounded-3xl border border-black/10 bg-[#f8f5ed] p-7">
          <h3 className="text-xl font-black">Enter your address once, securely at Stripe</h3>
          <p className="mt-3 leading-7 text-black/60">After you continue, Stripe will collect and validate your delivery address and phone number together with payment. That confirmed address is sent automatically to our Printify production partner after successful payment.</p>
          <ul className="mt-6 space-y-3 text-sm font-bold"><li>✓ Secure Stripe-hosted checkout</li><li>✓ Canada and United States delivery</li><li>✓ Automatic production after confirmed payment</li><li>✓ Live Printify status and tracking in your account</li></ul>
        </div>
      </section>
      <aside className="checkout-summary"><h2>Order summary</h2><div>{items.map((item) => <p key={`${item.productId}-${item.variantId}`}><span>{item.quantity} × {item.title}</span><strong>${((item.price * item.quantity) / 100).toFixed(2)}</strong></p>)}</div><footer><span>Subtotal</span><strong>${(subtotal / 100).toFixed(2)}</strong></footer><small>Secure payment, delivery address, shipping and applicable taxes are completed at Stripe.</small><button disabled={busy}>{busy ? "Opening secure checkout…" : "Continue to secure payment"}</button></aside>
    </form>
  </main>;
}
