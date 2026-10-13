import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, safeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Original Designs. Your Own Way.",
  description: "Explore original made-to-order apparel, accessories and everyday pieces. Wear The Risk. Make it yours.",
  alternates: { canonical: "/" },
};

function productImage(product: PrintifyProduct) {
  return product.images.find((image) => image.is_default) ?? product.images[0];
}
function productPrice(product: PrintifyProduct) {
  const variants = product.variants.filter((variant) => variant.is_enabled && variant.is_available);
  return variants.length ? Math.min(...variants.map((variant) => variant.price)) / 100 : null;
}

export default async function Home() {
  const { products, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const featured = products.slice(0, 8);
  const heroProduct = products[0];
  const heroImage = heroProduct && productImage(heroProduct);
  const populatedCategories = categories.filter((category) => productsForStoreCategory(products, category).length);
  const jsonLd = { "@context": "https://schema.org", "@type": "ItemList", name: `Featured ${SITE_NAME} products`, itemListElement: featured.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(`/products/${product.id}`), name: product.title })) };

  return <main className="store-home">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <section className="risk-hero" aria-labelledby="hero-title">
      <div className="risk-hero-copy">
        <p className="eyebrow">Independent by design</p>
        <h1 id="hero-title">YOUR STYLE.<br /><span>YOUR RULES.</span></h1>
        <p className="risk-hero-description">Original pieces for people who do things their own way. Choose your design. We make it for you.</p>
        <div className="risk-hero-actions"><Link href="#shop" className="button button-dark">Explore the collection <span aria-hidden="true">↗</span></Link><Link href="/about" className="text-link">Our story</Link></div>
        <p className="hero-footnote">Made to order. Never made to blend in.</p>
      </div>
      <div className="risk-hero-visual">
        {heroImage ? <Link href={`/products/${heroProduct.id}`} className="hero-product-link"><Image src={heroImage.src} alt={heroProduct.title} fill sizes="(min-width: 900px) 50vw, 100vw" className="object-contain" preload /><span className="hero-product-caption"><span>{heroProduct.title}</span><b aria-hidden="true">↗</b></span></Link> : <div className="hero-type-art" aria-label="Wear The Risk: made your way"><span className="hero-art-label">WEAR THE RISK / ORIGINAL DESIGN</span><strong>BE<br />YOUR<br /><span>SELF.</span></strong><span className="hero-art-bottom">No permission needed. <b aria-hidden="true">↗</b></span></div>}
      </div>
    </section>
    <div className="store-benefits" aria-label="Shopping information"><span>Made to order</span><span>Canada & United States</span><span>Free shipping $75+ CAD</span></div>
    <section id="shop" className="shop-section" aria-labelledby="shop-title">
      <div className="shop-section-heading"><div><p className="eyebrow">The collection</p><h2 id="shop-title">Find your next favourite.</h2></div><span className="shop-currency">Prices in CAD</span></div>
      {populatedCategories.length > 0 && <nav className="category-tabs" aria-label="Browse collections">{populatedCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`}>{category.title}<span aria-hidden="true">↗</span></Link>)}</nav>}
      {featured.length ? <div id="product-grid" className="risk-product-grid">{featured.map((product) => {
        const image = productImage(product); const price = productPrice(product);
        return <Link href={`/products/${product.id}`} key={product.id} className="risk-product-card"><div className="risk-product-image">{image && <Image src={image.src} alt={product.title} fill sizes="(min-width: 1100px) 25vw, (min-width: 650px) 33vw, 50vw" className="object-contain" />}<span aria-hidden="true">↗</span></div><h3>{product.title}</h3><p>{price === null ? "See available options" : `From $${price.toFixed(2)}`}</p></Link>;
      })}</div> : <div className="risk-empty"><span className="eyebrow">Coming next</span><h3>A new collection is in the making.</h3><p>Original designs take a little time. Come back soon to find your next piece.</p><Link href="/about" className="text-link">Get to know Wear The Risk <span aria-hidden="true">↗</span></Link></div>}
      {populatedCategories.length > 0 && <div className="collection-directory"><p>Keep exploring</p>{populatedCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`}>All {category.title.toLowerCase()} <span aria-hidden="true">→</span></Link>)}</div>}
    </section>
    <section className="risk-story" aria-labelledby="story-title"><p className="eyebrow">Less noise. More you.</p><h2 id="story-title">Made for you.<br /><span>Only when you choose it.</span></h2><div><p>No piles of finished inventory. Your order starts production with our specialist print partners. Original design, made on demand.</p><Link href="/about" className="button button-light">How we make it <span aria-hidden="true">↗</span></Link></div></section>
    <section className="risk-notes" aria-labelledby="notes-title"><div><p className="eyebrow">Stay in the loop</p><h2 id="notes-title">Good things. Occasionally.</h2><p>Choose collection news and occasional offers in your account.</p></div><Link href="/account" className="button button-outline">Email preferences <span aria-hidden="true">→</span></Link></section>
  </main>;
}
