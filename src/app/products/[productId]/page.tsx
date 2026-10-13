import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductReviews } from "@/components/product-reviews";
import { getPrintifyProduct } from "@/lib/printify/client";
import { productBelongsToCategory } from "@/lib/catalog/categories";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { getPublishedReviews } from "@/lib/reviews/server";
import { SITE_NAME, absoluteUrl, metaDescription, safeJsonLd } from "@/lib/seo";

interface Props { params: Promise<{ productId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPrintifyProduct(productId).catch(() => null);
  if (!product?.visible) return { title: "Product not found", robots: { index: false, follow: false } };
  const description = metaDescription(product.description);
  const images = product.images.slice(0, 4).map((image) => ({ url: image.src, alt: product.title }));
  return {
    title: product.title,
    description,
    keywords: [...new Set([product.title, ...product.tags, "made to order Canada", SITE_NAME])],
    alternates: { canonical: `/products/${product.id}` },
    openGraph: { type: "website", url: `/products/${product.id}`, title: `${product.title} | ${SITE_NAME}`, description, siteName: SITE_NAME, images },
    twitter: { card: "summary_large_image", title: product.title, description, images: images.map((image) => image.url) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const product = await getPrintifyProduct(productId).catch(() => null);
  if (!product || !product.visible) notFound();
  const images = product.images;
  const mainImage = images.find((item) => item.is_default) ?? images[0];
  const variants = product.variants.filter((item) => item.is_enabled && item.is_available);
  const description = product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const { categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const category = categories.find((item) => productBelongsToCategory(product, item));
  const reviews = await getPublishedReviews(product.id);
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const productUrl = absoluteUrl(`/products/${product.id}`);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    description,
    url: productUrl,
    image: images.map((image) => image.src),
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: category?.title,
    ...(variants.length ? { offers: variants.map((variant) => ({ "@type": "Offer", url: productUrl, sku: variant.sku || `${product.id}-${variant.id}`, priceCurrency: "CAD", price: (variant.price / 100).toFixed(2), availability: variant.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition", seller: { "@id": `${absoluteUrl("/")}#organization` } })) } : {}),
    ...(reviews.length ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: averageRating.toFixed(2), reviewCount: reviews.length, bestRating: 5, worstRating: 1 },
      review: reviews.slice(0, 10).map((review) => ({ "@type": "Review", name: review.title, reviewBody: review.body, datePublished: review.updatedAt?.slice(0, 10), author: { "@type": "Person", name: review.authorName }, reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 } })),
    } : {}),
  };
  const breadcrumbJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    ...(category ? [{ "@type": "ListItem", position: 2, name: category.title, item: absoluteUrl(`/categories/${category.slug}`) }] : []),
    { "@type": "ListItem", position: category ? 3 : 2, name: product.title, item: productUrl },
  ] };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd([productJsonLd, breadcrumbJsonLd]) }} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm"><Link href="/" className="font-bold text-emerald-700">Home</Link><span>›</span>{category && <><Link href={`/categories/${category.slug}`} className="font-bold text-emerald-700">{category.title}</Link><span>›</span></>}<span aria-current="page" className="text-black/50">{product.title}</span></nav>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {images.slice(0, 4).map((image, index) => <div key={`${image.src}-${index}`} className={`relative overflow-hidden rounded-3xl bg-white ${index === 0 ? "sm:col-span-2 aspect-[4/3]" : "aspect-square"}`}><Image src={image.src} alt={`${product.title} view ${index + 1}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" priority={index === 0} /></div>)}
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Made to order</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{product.title}</h1>
          <p className="mt-5 text-lg font-bold">From ${variants.length ? (Math.min(...variants.map((item) => item.price)) / 100).toFixed(2) : "—"}</p>
          <p className="mt-6 leading-7 text-black/60">{description}</p>
          <AddToCart productId={product.id} title={product.title} image={mainImage?.src ?? ""} variants={variants} />
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-black/10 pt-6 text-center text-xs font-bold"><span>Made to order</span><span>Secure checkout</span><span>Quality print</span></div>
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </main>
  );
}
