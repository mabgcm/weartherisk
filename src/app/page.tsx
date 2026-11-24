import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { activeCollections, collectionBySlug, newArrivals, productsForCollection } from "@/lib/catalog/collections";
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

/** Deterministic weekly pick so the "phrase of the week" rotates every Monday. */
function phraseOfTheWeek(products: PrintifyProduct[]): PrintifyProduct | undefined {
  if (!products.length) return undefined;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return products[week % products.length];
}


/** Camera labels for the modelled product shots, best first (bright studio model photos, the category's hero style). */
const HERO_LABEL_PRIORITY = ["person-1", "person-front", "duo-2", "person-2", "person-3", "lifestyle", "lifestyle-2"];

/** Best modelled shot for a product, or undefined when it only has flat product photos. */
function heroImageFor(product: PrintifyProduct) {
  let best: PrintifyProduct["images"][number] | undefined;
  let bestScore = Infinity;
  for (const image of product.images) {
    const label = /camera_label=([\w-]+)/.exec(image.src)?.[1] ?? "";
    const score = HERO_LABEL_PRIORITY.indexOf(label);
    if (score >= 0 && score < bestScore) { best = image; bestScore = score; }
  }
  return best;
}

/** Christmas apparel with a modelled shot, tees first, for the hero rotation. */
function christmasHeroSlides(products: PrintifyProduct[]) {
  const christmas = collectionBySlug("christmas");
  if (!christmas) return [];
  const rank = (title: string) => (title.includes("T-Shirt") ? 0 : title.includes("Hoodie") ? 1 : 2);
  return productsForCollection(products, christmas)
    .filter((product) => !/mug|tumbler|tote|bag|magnet/i.test(product.title))
    .flatMap((product) => {
      const image = heroImageFor(product);
      return image ? [{ id: product.id, title: product.title, image: image.src }] : [];
    })
    .sort((a, b) => rank(a.title) - rank(b.title))
    .slice(0, 3);
}

/** WoW hero picks: one face from each gaming drop, in display order. */
const WOW_HERO_PICKS = ["Helm of Domination", "Grand Marshal", "For the Horde Trucker", "Druid Class"];

function wowHeroSlides(products: PrintifyProduct[]) {
  const slides: { id: string; title: string; image: string }[] = [];
  for (const pick of WOW_HERO_PICKS) {
    const product = products.find((item) => item.title.includes(pick));
    if (!product) continue;
    const image = heroImageFor(product) ?? productImage(product);
    if (image) slides.push({ id: product.id, title: product.title, image: image.src });
    if (slides.length >= 3) break;
  }
  return slides;
}

export default async function Home() {
  const { products, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const collections = activeCollections(products);
  const heroSlides = [...christmasHeroSlides(products).slice(0, 1), ...wowHeroSlides(products)];
  const fresh = newArrivals(products, 8);
  const phrase = phraseOfTheWeek(products);
  const phraseImage = phrase && productImage(phrase);
  const populatedCategories = categories.filter((category) => productsForStoreCategory(products, category).length);
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
            <Link href={`/products/${phrase.id}`} className="button button-light">Get this one </Link>
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
              <Link key={category.slug} href={`/categories/${category.slug}`}>{category.title}</Link>
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
            <Link href="/about" className="text-link">Get to know Wear The Risk </Link>
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
          <Link href="/about" className="button button-light">How we make it </Link>
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
