import type { Metadata } from "next";
import type { PrintifyProduct, PrintifyVariant } from "@/lib/printify/client";
import type { PublishedReview } from "@/lib/reviews/server";
import { SITE_NAME, absoluteUrl, metaDescription, plainText } from "@/lib/seo";

export function productVariants(product: PrintifyProduct) {
  return product.variants.filter((variant) => variant.is_enabled && Number.isInteger(variant.price) && variant.price > 0);
}

export function productImages(product: PrintifyProduct, variantId?: number) {
  const related = variantId === undefined ? [] : product.images.filter((image) => image.variant_ids?.includes(variantId));
  const ordered = [...related.filter((image) => image.is_default), ...related, ...product.images.filter((image) => image.is_default), ...product.images];
  const seen = new Set<string>();
  return ordered.filter((image) => {
    if (!image.src || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  }).map((image, index) => ({ ...image, is_default: index === 0 }));
}

export function productTitle(product: PrintifyProduct) {
  const name = plainText(product.title).split(/\s+\|\s+/)[0];
  if (name.length <= 80) return name;
  return name.slice(0, 77).replace(/\s+\S*$/, "").trimEnd() + "…";
}

export function productMetadata(product: PrintifyProduct): Metadata {
  const title = `${productTitle(product)} | ${SITE_NAME}`;
  const description = metaDescription(`${productTitle(product)}. ${plainText(product.description) || "Original design, made to order. Explore available options and current CAD prices."}`);
  const url = absoluteUrl(`/products/${product.id}`);
  const images = productImages(product).slice(0, 4).map((image) => ({ url: image.src, alt: plainText(product.title) }));
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: "website", locale: "en_CA", url, title, description, siteName: SITE_NAME, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((image) => image.url) },
  };
}

function variantAttributes(product: PrintifyProduct, variant: PrintifyVariant) {
  const attributes: Record<string, string> = {};
  for (const option of product.options ?? []) {
    if (!["color", "size", "material", "pattern"].includes(option.type)) continue;
    const value = option.values.find((candidate) => variant.options?.includes(candidate.id));
    if (value) attributes[option.type] = plainText(value.title);
  }
  return attributes;
}

const returnPolicy = () => ({
  "@type": "MerchantReturnPolicy", applicableCountry: ["CA", "US"],
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
  merchantReturnLink: absoluteUrl("/shipping"),
});

function offer(product: PrintifyProduct, variant: PrintifyVariant) {
  const url = `${absoluteUrl(`/products/${product.id}`)}?variant=${variant.id}`;
  return {
    "@type": "Offer", url, sku: variant.sku || `${product.id}-${variant.id}`,
    priceCurrency: "CAD", price: (variant.price / 100).toFixed(2),
    availability: variant.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${absoluteUrl("/")}#organization` },
    hasMerchantReturnPolicy: { "@id": `${absoluteUrl(`/products/${product.id}`)}#return-policy` },
    shippingDetails: ["CA", "US"].map((country) => ({ "@id": `${absoluteUrl(`/products/${product.id}`)}#shipping-${variant.price >= 7500 ? "free" : "standard"}-${country}` })),
  };
}

export function productStructuredData(product: PrintifyProduct, category?: { slug: string; title: string }, reviews: PublishedReview[] = []) {
  const url = absoluteUrl(`/products/${product.id}`);
  const variants = productVariants(product);
  const published = reviews.filter((review) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 && review.authorName && review.title && review.body);
  const common = {
    name: plainText(product.title), description: plainText(product.description) || plainText(product.title),
    image: productImages(product).map((image) => image.src), brand: { "@type": "Brand", name: SITE_NAME },
    category: category?.title,
    ...(published.length ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: Number((published.reduce((sum, review) => sum + review.rating, 0) / published.length).toFixed(2)), reviewCount: published.length, bestRating: 5, worstRating: 1 },
      review: published.slice(0, 10).map((review) => ({ "@type": "Review", name: review.title, reviewBody: review.body, datePublished: review.updatedAt?.slice(0, 10), author: { "@type": "Person", name: review.authorName }, reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 } })),
    } : {}),
  };
  const variesBy = [...new Set(variants.flatMap((variant) => Object.keys(variantAttributes(product, variant))))].map((attribute) => `https://schema.org/${attribute}`);
  const grouped = variants.length > 1 && variesBy.length > 0;
  const entity = grouped ? {
    "@context": "https://schema.org", "@type": "ProductGroup", "@id": `${url}#product`, url,
    ...common, productGroupID: product.id, variesBy,
    hasVariant: variants.map((variant) => ({
      "@type": "Product", "@id": `${url}#variant-${variant.id}`,
      name: `${plainText(product.title)} — ${plainText(variant.title)}`,
      sku: variant.sku || `${product.id}-${variant.id}`,
      image: productImages(product, variant.id).slice(0, 1).map((image) => image.src),
      ...variantAttributes(product, variant), offers: offer(product, variant),
    })),
  } : {
    "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`, url,
    ...common, sku: product.id,
    ...(variants.length ? { offers: variants.map((variant) => offer(product, variant)) } : {}),
  };
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    ...(category ? [{ "@type": "ListItem", position: 2, name: category.title, item: absoluteUrl(`/categories/${category.slug}`) }] : []),
    { "@type": "ListItem", position: category ? 3 : 2, name: plainText(product.title), item: url },
  ] };
  const shipping = [...new Set(variants.map((variant) => variant.price >= 7500 ? "free" : "standard"))].flatMap((rate) => ["CA", "US"].map((country) => ({
    "@context": "https://schema.org", "@type": "OfferShippingDetails", "@id": `${url}#shipping-${rate}-${country}`,
    shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
    shippingRate: { "@type": "MonetaryAmount", value: rate === "free" ? 0 : 7.99, currency: "CAD" },
    deliveryTime: { "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 10, unitCode: "DAY" },
    },
  })));
  return [entity, breadcrumbs, { "@context": "https://schema.org", "@id": `${url}#return-policy`, ...returnPolicy() }, ...shipping];
}
