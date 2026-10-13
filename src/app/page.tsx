import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, safeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Original Gifts, Apparel & Art Prints",
  description: "Discover meaningful gifts, apparel and art prints. Original designs, premium materials and made-to-order production with less waste.",
  alternates: { canonical: "/" },
};

const categories = [
  { name: "Wear your story", label: "Apparel", tone: "coral", symbol: "01", href: "/categories/t-shirts" },
  { name: "Make their day", label: "Gifts", tone: "lilac", symbol: "02", href: "/categories/mugs" },
  { name: "Style your space", label: "Home & art", tone: "sage", symbol: "03", href: "/categories/home-living" },
];

function productImage(product?: PrintifyProduct) {
  return product?.images.find((image) => image.is_default) ?? product?.images[0];
}

function productPrice(product: PrintifyProduct) {
  const variants = product.variants.filter((variant) => variant.is_enabled && variant.is_available);
  return variants.length ? Math.min(...variants.map((variant) => variant.price)) / 100 : null;
}

export default async function Home() {
  const { products, categories: storeCategories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const featured = products.slice(0, 8);
  const heroProduct = products[0];
  const heroImage = productImage(heroProduct);
  const circleItems = storeCategories.map((category) => {
    const product = productsForStoreCategory(products, category)[0];
    return { label: category.title, slug: category.slug, color: category.color, product, image: productImage(product) };
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: `Featured ${SITE_NAME} products`,
        itemListElement: featured.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/products/${product.id}`),
          name: product.title,
        })),
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Made for your kind of original</p>
          <h1>Not just printed.<br /><em>Made with purpose.</em></h1>
          <p className="hero-lede">Turn the things you love into one-of-a-kind pieces—thoughtfully designed, beautifully made, and unmistakably yours.</p>
          <div className="hero-actions">
            <Link href="#shop" className="button button-dark">Explore the collection <span aria-hidden="true">↗</span></Link>
            <Link href="/about" className="text-link">How it&apos;s made <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hero-proof" aria-label="Made-to-order promise">
            <div className="proof-faces" aria-hidden="true"><span>CA</span><span>✦</span><span>01</span></div>
            <div><strong>Original design</strong><small>Made to order with care</small></div>
          </div>
        </div>

        <div className="hero-art" aria-label={heroProduct ? `Featured product: ${heroProduct.title}` : "Printstore featured design"}>
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <p className="art-note note-top">Small batch<br />big feeling <span>✦</span></p>
          <p className="art-note note-bottom">Made to order<br />Made to matter</p>
          <div className="hero-product-frame">
            {heroImage ? <Image src={heroImage.src} alt={heroProduct.title} fill sizes="(min-width: 1024px) 48vw, 94vw" className="object-cover" priority /> : <div className="fallback-art"><span>YOU</span><strong>look good<br />being you.</strong></div>}
          </div>
          <div className="stamp" aria-hidden="true">PRINTSTORE<br />ORIGINAL</div>
        </div>
      </section>

      <section className="ticker" aria-label="Printstore benefits"><div><span>Made to order</span><b>✦</b><span>Designed with feeling</span><b>✦</b><span>Premium materials</span><b>✦</b><span>Shipped with care</span></div></section>

      <section className="circle-categories" aria-labelledby="circle-category-title">
        <div className="circle-category-heading"><div><p className="eyebrow"><span /> Explore the studio</p><h2 id="circle-category-title">Find your new favourite</h2></div><Link href="#shop" className="text-link">Shop everything <span>→</span></Link></div>
        <div className="circle-category-track">
          {circleItems.map((item) => <Link href={`/categories/${item.slug}`} className="circle-category" key={item.label}>
            <div className="circle-category-image" style={{ backgroundColor: item.color }}>{item.image ? <Image src={item.image.src} alt="" fill sizes="180px" className="object-cover" /> : <span aria-hidden="true">✦</span>}<i aria-hidden="true">↗</i></div>
            <h3>{item.label}</h3><p>{item.product ? "Shop the edit" : "Coming soon"}</p>
          </Link>)}
        </div>
      </section>

      <section className="section categories-section" aria-labelledby="category-title">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> Find your thing</p><h2 id="category-title">Start with what<br /><em>feels like you.</em></h2></div>
          <p>From everyday essentials to unforgettable gifts, discover pieces designed to carry a little more meaning.</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => <Link className={`category-card ${category.tone}`} href={category.href} key={category.label}><div className="category-number">{category.symbol}</div><div className="category-shape"><span>{category.label === "Apparel" ? "YOUR" : category.label === "Gifts" ? "FOR YOU" : "HOME"}</span><strong>{category.label === "Apparel" ? "voice, worn well" : category.label === "Gifts" ? "with feeling" : "made warmer"}</strong></div><div className="category-bottom"><div><small>{category.label}</small><h3>{category.name}</h3></div><span className="round-arrow" aria-hidden="true">↗</span></div></Link>)}
        </div>
      </section>

      <section id="shop" className="section product-section" aria-labelledby="shop-title">
        <div className="shop-heading"><div><p className="eyebrow"><span /> Fresh from the studio</p><h2 id="shop-title">Things we think<br /><em>you&apos;ll love.</em></h2></div><Link href="#product-grid" className="text-link">View the collection <span>→</span></Link></div>
        {featured.length ? <div id="product-grid" className="product-grid">{featured.map((product, index) => { const image = productImage(product); const price = productPrice(product); return <Link href={`/products/${product.id}`} key={product.id} className={`product-card ${index === 0 ? "featured-product" : ""}`}><div className="product-image">{image && <Image src={image.src} alt={product.title} fill sizes={index === 0 ? "(min-width: 900px) 48vw, 100vw" : "(min-width: 900px) 24vw, 50vw"} className="object-cover" />}<span className="quick-look">View piece ↗</span></div><div className="product-info"><div><h3>{product.title}</h3><p>Made especially for you</p></div>{price !== null && <strong>From ${price.toFixed(2)}</strong>}</div></Link>; })}</div> : <div className="empty-products"><span>✦</span><h3>Fresh pieces are in the works.</h3><p>Our next collection will be here soon. Good things are worth making well.</p></div>}
      </section>

      <section className="manifesto">
        <div className="manifesto-mark" aria-hidden="true">P</div>
        <div><p className="eyebrow light"><span /> Our point of view</p><blockquote>“The best things you own should say something <em>about you</em>—not everyone else.”</blockquote><p className="manifesto-copy">We make expressive, useful objects in considered quantities. No mountains of inventory. No disposable trends. Just great design, produced when you choose it.</p><Link href="/about" className="button button-light">Meet the studio <span>→</span></Link></div>
        <div className="values"><div><b>01</b><h3>Original by design</h3><p>Created with a point of view, not pulled from a template.</p></div><div><b>02</b><h3>Made on demand</h3><p>Your order starts production, helping us make only what matters.</p></div><div><b>03</b><h3>Chosen with care</h3><p>Quality partners and materials we&apos;re proud to put our name on.</p></div></div>
      </section>

      <section className="newsletter" aria-labelledby="newsletter-title"><div><p className="eyebrow"><span /> Notes from the studio</p><h2 id="newsletter-title">Good things,<br /><em>occasionally.</em></h2></div><div><p>New drops, behind-the-scenes stories and special offers. No clutter—just the good stuff.</p><form action="mailto:hello@printstore.local" method="post" encType="text/plain"><label className="sr-only" htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="Your email address" required /><button type="submit" aria-label="Join the Printstore newsletter">Join us <span>→</span></button></form><small>By subscribing, you agree to our Privacy Policy.</small></div></section>
    </main>
  );
}
