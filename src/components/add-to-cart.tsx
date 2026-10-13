"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers";

interface Variant { id: number; title: string; price: number; available?: boolean }

export function AddToCart({ productId, title, image, variants, initialVariantId }: { productId: string; title: string; image: string; variants: Variant[]; initialVariantId?: number }) {
  const [variantId, setVariantId] = useState(initialVariantId ?? variants.find((variant) => variant.available !== false)?.id ?? variants[0]?.id ?? 0);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  const selected = variants.find((variant) => variant.id === variantId);
  const { addItem } = useCart();
  const router = useRouter();

  if (!selected) return <p className="rounded-lg bg-red-50 p-4 text-red-700">This product is currently unavailable.</p>;

  function add(buyNow = false) {
    if (pending || selected?.available === false) return;
    addItem({ productId, variantId: selected!.id, title, variantTitle: selected!.title, image, price: selected!.price, quantity: 1 });
    setAdded(true);
    if (buyNow) router.push("/checkout");
  }

  return <div className="purchase-panel" aria-busy={pending}>
    <label htmlFor="variant" className="field-label">Choose an option</label>
    <select id="variant" value={variantId} onChange={(event) => { const id = Number(event.target.value); setVariantId(id); setAdded(false); startTransition(() => router.replace(`/products/${productId}?variant=${id}`, { scroll: false })); }} className="store-select">
      {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.title} — ${(variant.price / 100).toFixed(2)}{variant.available === false ? " — Out of stock" : ""}</option>)}
    </select>
    {selected.available === false && <p role="status" className="mt-3 text-sm text-black/60">This option is currently out of stock. Choose another option if available.</p>}
    <div className="buy-actions"><button disabled={pending || selected.available === false} onClick={() => add()} className="button-secondary">{added ? "Added to bag ✓" : "Add to bag"}</button><button disabled={pending || selected.available === false} onClick={() => add(true)} className="button-primary">Buy now</button></div>
  </div>;
}
