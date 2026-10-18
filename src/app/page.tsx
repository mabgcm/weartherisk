import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { activeCollections, newArrivals } from "@/lib/catalog/collections";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, safeJsonLd } from "@/lib/seo";
import { StatementHero } from "@/components/statement-hero";
import { CollectionRail, ProductCard } from "@/components/collection-rail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Wear The Risk | Say It Like You Mean It – Original Statement Gifts" },
  description: "Original statement apparel, mugs, art prints and gifts. The things you think but never say out loud. Wear The Risk.",
  alternates: { canonical: "/" },
};

function productImage(product: PrintifyProduct) {
  return product.images.find((image) => image.is_default) ?? product.images[0];
}

/** Baby/toddler products stay out of the hero spotlight. */
function isBabyProduct(product: PrintifyProduct) {
  return /bodysuit|baby|infant|toddler|newborn/i.test(`${product.title} ${(product.tags ?? []).join(" ")}`);
}

/** Deterministic weekly pick so the "phrase of the week" rotates every Monday. */
function phraseOfTheWeek(products: PrintifyProduct[]): PrintifyProduct | undefined {
  if (!products.length) return undefined;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return products[week % products.length];
}

export default async function Home() {
  const { products, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const collections = activeCollections(products);
  const fresh = newArrivals(products, 8);
  const phrase = phraseOfTheWeek(products);
  const phraseImage = phrase && productImage(phrase);
  const populatedCategories = categories.filter((category) => productsForStoreCategory(products, category).length);
  const heroSlides = products.filter((product) => !isBabyProduct(product)).slice(0, 3).map((product) => ({
    id: product.id,
    title: product.title,
    image: productImage(product)?.src,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `New arrivals at ${SITE_NAME}`,
    itemListElement: fresh.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.id}`),
      name: product.title,
    })),
  };

  return (
    <main className="store-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <StatementHero slides={heroSlides} />

      <div className="store-benefits" aria-label="Shopping information">
        <span>Original designs</span><span>Canada & United States</span><span>Free shipping $75+ CAD</span>
      </div>

      {collections.length > 0 && (
        <div id="collections">
          {collections.map(({ collection, products: items }) => (
            <CollectionRail key={collection.slug} collection={collection} products={items} />
          ))}
        </div>
      )}

      {fresh.length > 0 && (
        <section id="new" className="fresh-section" aria-labelledby="fresh-title">
          <div className="shop-section-heading">
            <div>
              <p className="eyebrow">Fresh off the press</p>
              <h2 id="fresh-title">New arrivals</h2>
            </div>
            <Link href="/search?sort=new" className="text-link">View all <span aria-hidden="true">→</span></Link>
          </div>
          <div className="fresh-rail">
            {fresh.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {phrase && (
        <section className="phrase-week" aria-labelledby="phrase-title">
          <div className="phrase-copy">
            <p className="eyebrow">Phrase of the week</p>
            <h2 id="phrase-title">&ldquo;{phrase.title}&rdquo;</h2>
            <p>One design, one sentence, zero apologies. A new loud thought every Monday.</p>
            <Link href={`/products/${phrase.id}`} className="button button-light">Get this one <span aria-hidden="true">↗</span></Link>
          </div>
          {phraseImage && (
            <Link href={`/products/${phrase.id}`} className="phrase-art" aria-label={`Shop ${phrase.title}`}>
              <Image src={phraseImage.src} alt={phrase.title} fill sizes="(min-width: 900px) 40vw, 100vw" className="object-contain" />
            </Link>
          )}
        </section>
      )}

      <section id="shop" className="shop-section" aria-labelledby="shop-title">
        <div className="shop-section-heading">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="shop-title">Shop by product</h2>
          </div>
          <span className="shop-currency">Prices in CAD</span>
        </div>
        {populatedCategories.length > 0 && (
          <nav className="category-tabs" aria-label="Browse collections">
            {populatedCategories.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>{category.title}<span aria-hidden="true">↗</span></Link>
            ))}
          </nav>
        )}
        {products.length ? (
          <div id="product-grid" className="risk-product-grid">
            {products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="risk-empty">
            <span className="eyebrow">Coming next</span>
            <h3>A new collection is in the making.</h3>
            <p>Original designs take a little time. Come back soon to find your next piece.</p>
            <Link href="/about" className="text-link">Get to know Wear The Risk <span aria-hidden="true">↗</span></Link>
          </div>
        )}
        {populatedCategories.length > 0 && (
          <div className="collection-directory">
            <p>Keep exploring</p>
            {populatedCategories.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>All {category.title.toLowerCase()} <span aria-hidden="true">→</span></Link>
            ))}
          </div>
        )}
      </section>

      <section className="risk-story" aria-labelledby="story-title">
        <p className="eyebrow">Less noise. More you.</p>
        <h2 id="story-title">Made for you.<br /><span>Only when you choose it.</span></h2>
        <div>
          <p>Every piece starts as an original Wear The Risk design — the sentence you think but never say, given the typography it deserves.</p>
          <Link href="/about" className="button button-light">How we make it <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="risk-notes" aria-labelledby="notes-title">
        <div>
          <p className="eyebrow">Stay in the loop</p>
          <h2 id="notes-title">New drops, first.</h2>
          <p>Fresh phrases land every season. Choose collection news and new-drop alerts in your account.</p>
        </div>
        <Link href="/account" className="button button-outline">Email preferences <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
