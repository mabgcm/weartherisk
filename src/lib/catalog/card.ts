import type { PrintifyProduct } from "@/lib/printify/client";

/**
 * Minimal product data a storefront card renders. Product cards only need an
 * id, a title, one image and a from-price — passing whole Printify products
 * (variants, print areas, every image) to the browser made the homepage
 * payload several megabytes.
 */
export interface CardProduct {
  id: string;
  title: string;
  image: string | null;
  /** Lowest enabled + available variant price in dollars; null when none. */
  price: number | null;
}

export function toCardProduct(product: PrintifyProduct): CardProduct {
  const image = product.images.find((entry) => entry.is_default) ?? product.images[0];
  const variants = product.variants.filter((variant) => variant.is_enabled && variant.is_available);
  return {
    id: product.id,
    title: product.title,
    image: image?.src ?? null,
    price: variants.length ? Math.min(...variants.map((variant) => variant.price)) / 100 : null,
  };
}
