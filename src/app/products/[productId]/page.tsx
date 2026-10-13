import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ProductGallery } from "@/components/product-gallery";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductReviews } from "@/components/product-reviews";
import { getPrintifyProduct, PrintifyApiError } from "@/lib/printify/client";
import { productBelongsToCategory } from "@/lib/catalog/categories";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { getPublishedReviews } from "@/lib/reviews/server";
import { plainText, safeJsonLd } from "@/lib/seo";
import { productImages, productMetadata, productStructuredData, productVariants } from "@/lib/catalog/product-seo";

interface Props { params: Promise<{ productId: string }>; searchParams: Promise<{ variant?: string }> }

const getProduct = cache(async (productId: string) => {
  try { return await getPrintifyProduct(productId); }
  catch (reason) {
    if (reason instanceof PrintifyApiError && reason.status === 404) return null;
    throw reason;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product?.visible) return { title: "Product not found", robots: { index: false, follow: false } };
  return productMetadata(product);
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product || !product.visible) notFound();
  const variants = productVariants(product);
  const { variant: requestedVariant } = await searchParams;
  const selected = variants.find((variant) => variant.id === Number(requestedVariant));
  const initialVariant = selected ?? variants.find((variant) => variant.is_available) ?? variants[0];
  const images = productImages(product, initialVariant?.id);
  const mainImage = images[0];
  const availableVariants = variants.filter((variant) => variant.is_available);
  const startingPrice = availableVariants.length ? Math.min(...availableVariants.map((variant) => variant.price)) : variants.length ? Math.min(...variants.map((variant) => variant.price)) : null;
  const description = plainText(product.description);
  const { categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const category = categories.find((item) => productBelongsToCategory(product, item));
  const reviews = await getPublishedReviews(product.id);
  const structuredData = productStructuredData(product, category, reviews);

  return (
    <main className="product-page mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm"><Link href="/" className="font-bold text-emerald-700">Home</Link><span>›</span>{category && <><Link href={`/categories/${category.slug}`} className="font-bold text-emerald-700">{category.title}</Link><span>›</span></>}<span aria-current="page" className="text-black/50">{product.title}</span></nav>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <ProductGallery key={`${product.id}-${initialVariant?.id}`} title={product.title} images={images} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Made to order</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{product.title}</h1>
          <p className="mt-5 text-lg font-bold">{selected ? "" : "From "}{(selected?.price ?? startingPrice) === null ? "See available options" : `$${((selected?.price ?? startingPrice ?? 0) / 100).toFixed(2)} CAD`}</p>
          <AddToCart key={`${product.id}-${initialVariant?.id}`} productId={product.id} title={product.title} image={mainImage?.src ?? ""} variants={variants.map((variant) => ({ ...variant, available: variant.is_available }))} initialVariantId={initialVariant?.id} />
          <p className="mt-4 text-sm leading-6 text-black/60">Made to order. Ships to Canada and the United States. Free standard shipping on merchandise subtotals of $75 CAD or more; otherwise $7.99 CAD. <Link href="/shipping" className="underline">Shipping &amp; returns</Link>.</p>
          <details className="product-description"><summary>Product details & care</summary><p>{description}</p></details>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-black/10 pt-6 text-center text-xs font-bold"><span>Made to order</span><span>Secure checkout</span><span>Quality print</span></div>
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </main>
  );
}
