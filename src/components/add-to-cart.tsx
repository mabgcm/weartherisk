"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers";

interface Variant { id: number; title: string; price: number }

export function AddToCart({ productId, title, image, variants }: { productId: string; title: string; image: string; variants: Variant[] }) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? 0);
  const [added, setAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId);
  const { addItem } = useCart();
  const router = useRouter();

  if (!selected) return <p className="rounded-2xl bg-red-50 p-4 text-red-700">This product is currently unavailable.</p>;

  function add(buyNow = false) {
    addItem({ productId, variantId: selected!.id, title, variantTitle: selected!.title, image, price: selected!.price, quantity: 1 });
    setAdded(true);
    if (buyNow) router.push("/checkout");
  }

  return <div className="purchase-panel">
    <label htmlFor="variant" className="field-label">Choose an option</label>
    <select id="variant" value={variantId} onChange={(event) => setVariantId(Number(event.target.value))} className="store-select">
      {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.title} — ${(variant.price / 100).toFixed(2)}</option>)}
    </select>
    <div className="buy-actions"><button onClick={() => add()} className="button-secondary">{added ? "Added to bag ✓" : "Add to bag"}</button><button onClick={() => add(true)} className="button-primary">Buy now</button></div>
  </div>;
}
