import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { activeCollections, newArrivals } from "@/lib/catalog/collections";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, safeJsonLd } from "@/lib/seo";
import { StatementHero } from "@/components/statement-hero";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Say It Like You Mean It.",
  description: "Original statement apparel, mugs, art prints and gifts. The things you think but never say out loud — made to order. Wear The Risk.",
  alternates: { canonical: "/" },
};

function productImage(product: PrintifyProduct) {
  return product.images.find((image) => image.is_default) ?? product.images[0];
}
function productPrice(product: PrintifyProduct) {
  const variants = product.variants.filter((variant) => variant.is_enabled && variant.is_available);
  return variants.length ? Math.min(...variants.map((variant) => variant.price)) / 100 : null;
}

function ProductCard({ product }: { product: PrintifyProduct }) {
  const image = productImage(product);
  const price = productPrice(product);
  return (
    <Link href={`/products/${product.id}`} className="risk-product-card">
      <div className="risk-product-image">
        {image && <Image src={image.src} alt={product.title} fill sizes="(min-width: 1100px) 25vw, (min-width: 650px) 33vw, 50vw" className="object-contain" />}
        <span aria-hidden="true">↗</span>
      </div>
      <h3>{product.title}</h3>
      <p>{price === null ? "See available options" : `From $${price.toFixed(2)}`}</p>
    </Link>
  );
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
  const moodCollections = collections.filter((entry) => !entry.collection.seasonal);
  const seasonalCollections = collections.filter((entry) => entry.collection.seasonal);
  const fresh = newArrivals(products, 8);
  const phrase = phraseOfTheWeek(products);
  const phraseImage = phrase && productImage(phrase);
  const populatedCategories = categories.filter((category) => productsForStoreCategory(products, category).length);
  const heroSlides = products.slice(0, 3).map((product) => ({
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
        <span>Made to order</span><span>Canada & United States</span><span>Free shipping $75+ CAD</span>
      </div>

      {moodCollections.length > 0 && (
        <section id="moods" className="mood-section" aria-labelledby="moods-title">
          <div className="shop-section-heading">
            <div>
              <p className="eyebrow">Shop by mood</p>
              <h2 id="moods-title">What&apos;s on your mind?</h2>
            </div>
            <span className="shop-currency">Pick the vibe. We&apos;ll handle the wording.</span>
          </div>
          <div className="mood-grid">
            {moodCollections.map(({ collection, products: items }) => {
              const cover = productImage(items[0]);
              return (
                <Link
                  href={`/collections/${collection.slug}`}
                  key={collection.slug}
                  className="mood-card"
                  style={{ ["--mood-color" as string]: collection.color }}
                >
                  <div className="mood-card-art">
                    {cover && <Image src={cover.src} alt="" fill sizes="(min-width: 900px) 33vw, 50vw" className="object-cover" />}
                  </div>
                  <div className="mood-card-body">
                    <h3>{collection.title}</h3>
                    <p>{collection.tagline}</p>
                    <span className="mood-count">{items.length} {items.length === 1 ? "design" : "designs"} <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {seasonalCollections.map(({ collection, products: items }) => {
        const cover = productImage(items[0]);
        return (
          <section key={collection.slug} className="seasonal-spotlight" aria-labelledby={`seasonal-${collection.slug}`}>
            <div className="seasonal-copy">
              <p className="eyebrow">Limited season</p>
              <h2 id={`seasonal-${collection.slug}`}>{collection.title}</h2>
              <p>{collection.blurb}</p>
              <Link href={`/collections/${collection.slug}`} className="button button-dark">
                Shop the drop <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <Link href={`/collections/${collection.slug}`} className="seasonal-art" aria-label={`Shop ${collection.title}`}>
              {cover && <Image src={cover.src} alt={items[0].title} fill sizes="(min-width: 900px) 50vw, 100vw" className="object-contain" />}
            </Link>
          </section>
        );
      })}

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
          <p>No piles of finished inventory. Your order starts production with our specialist print partners. Original design, made on demand.</p>
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
