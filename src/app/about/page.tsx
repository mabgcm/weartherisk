import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Can Print Store",
  description: "Learn how Can Print Store combines original designs with made-to-order production and independent specialist print partners.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <main className="mx-auto min-h-[65vh] max-w-3xl px-6 py-20">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Our story</p>
    <h1 className="mt-4 text-5xl font-black tracking-tight">Original designs, made for your order.</h1>
    <div className="mt-8 space-y-7 text-lg leading-8 text-black/60">
      <p>Can Print Store is a Canadian online design shop for expressive apparel, accessories, home pieces and gifts. We create products for people who want something more personal than conventional mass-market merchandise.</p>
      <p>We use a print-on-demand model. Instead of keeping large quantities of finished products in a warehouse, an item enters production after a customer places and pays for an order. This lets us offer a changing catalogue without producing conventional bulk inventory in advance.</p>
      <p>Orders are fulfilled through Printify and its network of independent specialist production partners. The facility can vary by product, availability and destination. Each partner handles production and dispatch, while Can Print Store remains the storefront responsible for your order and support.</p>
      <p>Product pages show the available variants, current CAD prices and mock-up images supplied through our production catalogue. Small differences between a digital preview and a finished product can occur because screens, materials and print processes reproduce colour and placement differently.</p>
      <p>We believe trust comes from being specific. Our <Link href="/shipping" className="font-bold text-emerald-800 underline">Shipping &amp; returns policy</Link> explains production, delivery and problem-resolution terms before you order.</p>
    </div>
  </main>;
}
