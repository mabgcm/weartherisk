"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  return <main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-12 sm:px-10 lg:px-16">
    <h1 className="text-4xl font-black tracking-tight">Your cart</h1>
    {items.length === 0 ? <div className="py-24 text-center"><p className="text-xl font-bold">Your cart is empty.</p><Link href="/#shop" className="mt-5 inline-flex rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">Explore the collection</Link></div> : <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="divide-y divide-black/10 border-y border-black/10">{items.map((item) => <article key={`${item.productId}-${item.variantId}`} className="flex gap-5 py-6"><div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-white">{item.image && <Image src={item.image} alt={item.title} fill sizes="112px" className="object-cover" />}</div><div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row"><div><Link href={`/products/${item.productId}`} className="font-bold">{item.title}</Link><p className="mt-1 text-sm text-black/50">{item.variantTitle}</p><button onClick={() => removeItem(item.productId, item.variantId)} className="mt-3 cursor-pointer text-sm font-semibold underline">Remove</button></div><div className="flex items-center gap-4 sm:block sm:text-right"><p className="font-bold">${((item.price * item.quantity) / 100).toFixed(2)}</p><select aria-label={`Quantity for ${item.title}`} value={item.quantity} onChange={(event) => updateQuantity(item.productId, item.variantId, Number(event.target.value))} className="mt-2 rounded-xl border border-black/15 bg-white px-3 py-2">{[1,2,3,4,5,6,7,8,9,10].map((value) => <option key={value}>{value}</option>)}</select></div></div></article>)}</div>
      <aside className="h-fit rounded-3xl bg-white p-7"><h2 className="text-xl font-black">Order summary</h2><div className="mt-6 flex justify-between border-b border-black/10 pb-5"><span>Subtotal</span><strong>${(subtotal / 100).toFixed(2)}</strong></div><p className="mt-4 text-sm leading-6 text-black/50">Shipping and taxes are calculated at checkout.</p><Link href="/checkout" className="mt-6 flex justify-center rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">Checkout</Link></aside>
    </div>}
  </main>;
}
