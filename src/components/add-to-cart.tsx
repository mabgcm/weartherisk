"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers";

export interface PickerVariant { id: number; title: string; price: number; available?: boolean; attributes: Record<string, string> }
export interface PickerOptionGroup { type: string; label: string; values: string[] }

// Approximate swatch colors for common Printify/Gildan color names.
const COLOR_HEX: Record<string, string> = {
  black: "#1b1b1b", white: "#ffffff", natural: "#f3ecdd", sand: "#d8c9a6", red: "#b3272d",
  gold: "#d2a41c", "irish green": "#0d7a40", "dark heather": "#54575d", charcoal: "#3a3e43",
  "light pink": "#f4cbd3", "graphite heather": "#676b70", maroon: "#6e1f2b", "carolina blue": "#8fb8d8",
  "dark chocolate": "#3f2517", navy: "#1f2a44", royal: "#2c4ea1", "forest green": "#1e4d2b",
  daisy: "#f5cf2e", orange: "#e2702b", purple: "#5c2d91", "light blue": "#bcdff0",
  "military green": "#5c5e3c", "cardinal red": "#a51e2f", ash: "#e7e7e1", "sport grey": "#b7babb",
  "heather navy": "#3a4560", "heather red": "#a83a3f", "azalea": "#ef8fb0", "berry": "#8c2b4b",
  "sky": "#a8d8ea", "mint": "#bfe8cf", "tan": "#d2b48c", "brown": "#5a3a26", "kelly green": "#0f8a3c",
  "lime": "#a8d81c", "yellow": "#f2d230", "pink": "#f2a7bb", "hot pink": "#e93a8b",
};

function colorHex(name: string): string | null {
  return COLOR_HEX[name.toLowerCase().trim()] ?? null;
}

export function AddToCart({ productId, title, image, variants, initialVariantId, optionGroups }: {
  productId: string; title: string; image: string; variants: PickerVariant[]; initialVariantId?: number; optionGroups?: PickerOptionGroup[];
}) {
  const [variantId, setVariantId] = useState(initialVariantId ?? variants.find((variant) => variant.available !== false)?.id ?? variants[0]?.id ?? 0);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  const selected = variants.find((variant) => variant.id === variantId);
  const { addItem } = useCart();
  const router = useRouter();

  if (!selected) return <p className="rounded-lg bg-red-50 p-4 text-red-700">This product is currently unavailable.</p>;

  const groups = (optionGroups ?? []).filter((group) => group.values.length > 0);
  const usePicker = groups.length > 0 && variants.length > 1;

  function changeVariant(id: number) {
    setVariantId(id);
    setAdded(false);
    startTransition(() => router.replace(`/products/${productId}?variant=${id}`, { scroll: false }));
  }

  function matchesAttributes(variant: PickerVariant, wanted: Record<string, string | undefined>) {
    return Object.entries(wanted).every(([key, value]) => value === undefined || variant.attributes[key] === value);
  }

  // Switch one attribute (e.g. color), keeping the others when possible.
  // Available variants always win over out-of-stock ones.
  function pick(patch: Record<string, string>) {
    const wanted = { ...selected.attributes, ...patch };
    const target =
      variants.find((variant) => variant.available !== false && matchesAttributes(variant, wanted)) ??
      variants.find((variant) => variant.available !== false && matchesAttributes(variant, patch)) ??
      variants.find((variant) => matchesAttributes(variant, wanted)) ??
      variants.find((variant) => matchesAttributes(variant, patch));
    if (target && target.id !== variantId) changeVariant(target.id);
  }

  function valueAvailable(group: PickerOptionGroup, value: string) {
    const other = Object.fromEntries(groups.filter((g) => g.type !== group.type).map((g) => [g.type, selected.attributes[g.type]]));
    return variants.some((variant) => variant.available !== false && variant.attributes[group.type] === value && matchesAttributes(variant, other));
  }

  function add(buyNow = false) {
    if (pending || selected?.available === false) return;
    addItem({ productId, variantId: selected!.id, title, variantTitle: selected!.title, image, price: selected!.price, quantity: 1 });
    setAdded(true);
    if (buyNow) router.push("/checkout");
  }

  return <div className="purchase-panel" aria-busy={pending}>
    {usePicker ? (
      <div className="variant-picker">
        {groups.map((group) => (
          <div key={group.type} className="variant-group">
            <p className="field-label">{group.label}: <span className="variant-current">{selected.attributes[group.type]}</span></p>
            {group.type === "color" ? (
              <div className="swatch-row" role="radiogroup" aria-label={group.label}>
                {group.values.map((value) => {
                  const hex = colorHex(value);
                  const isSelected = selected.attributes.color === value;
                  const disabled = !valueAvailable(group, value);
                  return <button key={value} type="button" role="radio" aria-checked={isSelected} aria-label={value} title={value}
                    disabled={disabled} onClick={() => pick({ [group.type]: value })}
                    className={`swatch${isSelected ? " swatch-selected" : ""}`}
                    style={hex ? { backgroundColor: hex } : { background: "linear-gradient(135deg,#e3e3e3 50%,#bcbcbc 50%)" }} />;
                })}
              </div>
            ) : (
              <div className="size-row" role="radiogroup" aria-label={group.label}>
                {group.values.map((value) => {
                  const isSelected = selected.attributes[group.type] === value;
                  const disabled = !valueAvailable(group, value);
                  return <button key={value} type="button" role="radio" aria-checked={isSelected} disabled={disabled}
                    onClick={() => pick({ [group.type]: value })}
                    className={`size-btn${isSelected ? " size-btn-selected" : ""}`}>{value}</button>;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    ) : variants.length > 1 ? (
      <>
        <label htmlFor="variant" className="field-label">Choose an option</label>
        <select id="variant" value={variantId} onChange={(event) => changeVariant(Number(event.target.value))} className="store-select">
          {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.title} — ${(variant.price / 100).toFixed(2)}{variant.available === false ? " — Out of stock" : ""}</option>)}
        </select>
      </>
    ) : null}
    {selected.available === false && <p role="status" className="mt-3 text-sm text-black/60">This option is currently out of stock. Choose another option if available.</p>}
    <div className="buy-actions"><button disabled={pending || selected.available === false} onClick={() => add(false)} className="button-secondary">{added ? "Added to bag ✓" : "Add to bag"}</button><button disabled={pending || selected.available === false} onClick={() => add(true)} className="button-primary">Buy now</button></div>
  </div>;
}
