import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { SortSelect } from "@/components/sort-select";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, metaDescription, safeJsonLd } from "@/lib/seo";

interface Props { searchParams: Promise<{ sort?: string; page?: string; type?: string }> }

function imageFor(product?: PrintifyProduct) { return product?.images.find((image) => image.is_default) ?? product?.images[0]; }
function priceFor(product: PrintifyProduct) { const prices = product.variants.filter((variant) => variant.is_enabled && variant.is_available).map((variant) => variant.price); return prices.length ? Math.min(...prices) : null; }

/** Shopper-facing product type, derived from the product title. */
function typeOf(product: PrintifyProduct): string {
  const title = product.title;
  if (/trucker/i.test(title)) return "Trucker hats";
  if (/\bcap\b|\bhat\b/i.test(title)) return "Caps";
  if (/tumbler/i.test(title)) return "Tumblers";
  if (/mug/i.test(title)) return "Mugs";
  if (/magnet/i.test(title)) return "Car magnets";
  if (/tote|backpack|duffel|\bbag\b/i.test(title)) return "Bags";
  if (/phone case|phone grip/i.test(title)) return "Phone cases";
  if (/sticker|decal/i.test(title)) return "Stickers & decals";
  if (/case|pendant|statue|luggage tag|card holder/i.test(title)) return "Accessories";
  return "Apparel";
}

const TYPE_ORDER = ["Apparel", "Caps", "Trucker hats", "Mugs", "Tumblers", "Bags", "Phone cases", "Stickers & decals", "Car magnets", "Accessories"];
const INTRO = "Every design in the store, in one place — statement apparel, hats, mugs, bags, car magnets and more.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  const { products: allProducts } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const page = Math.max(1, Number(query.page) || 1);
  const baseTitle = "All Products";
  const title = page > 1 ? `${baseTitle} – Page ${page}` : baseTitle;
  const description = metaDescription(INTRO);
  const cover = imageFor(allProducts[0]);
  const images = cover ? [{ url: cover.src, alt: "Wear The Risk products" }] : [];
  return {
    title,
    description,
    keywords: ["all products", "statement gifts", "funny gifts Canada", SITE_NAME],
    alternates: { canonical: "/shop" },
    openGraph: { type: "website", url: "/shop", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, images },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description, images: images.map((image) => image.url) },
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const query = await searchParams;
  const { products: allProducts } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));

  const presentTypes = new Set(allProducts.map(typeOf));
  const typeOptions = TYPE_ORDER.filter((type) => presentTypes.has(type));
  const activeType = query.type && typeOptions.includes(query.type) ? query.type : undefined;
  const products = allProducts.filter((product) => !activeType || typeOf(product) === activeType);

  const pageHref = (overrides: { page?: number; sort?: string; type?: string }) => {
    const params = new URLSearchParams();
    const sort = overrides.sort !== undefined ? overrides.sort : query.sort;
    const type = overrides.type !== undefined ? overrides.type : activeType;
    const targetPage = overrides.page !== undefined ? overrides.page : 1;
    if (sort) params.set("sort", sort);
    if (type) params.set("type", type);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/shop${qs ? `?${qs}` : ""}#products`;
  };

  if (query.sort === "price-low") products.sort((a, b) => (priceFor(a) ?? Infinity) - (priceFor(b) ?? Infinity));
  if (query.sort === "price-high") products.sort((a, b) => (priceFor(b) ?? -Infinity) - (priceFor(a) ?? -Infinity));
  if (query.sort === "name") products.sort((a, b) => a.title.localeCompare(b.title));
  if (query.sort === "name-desc") products.sort((a, b) => b.title.localeCompare(a.title));
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = 12;
  const pageCount = Math.max(1, Math.ceil(products.length / perPage));
  const visible = products.slice((page - 1) * perPage, page * perPage);
  const showingFrom = products.length ? (page - 1) * perPage + 1 : 0;
  const showingTo = Math.min(products.length, page * perPage);

  const shopUrl = absoluteUrl("/shop");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${shopUrl}#collection`,
        name: `All Products | ${SITE_NAME}`, description: INTRO, url: shopUrl,
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        mainEntity: {
          "@type": "ItemList", numberOfItems: products.length,
          itemListElement: visible.map((product, index) => ({
            "@type": "ListItem", position: (page - 1) * perPage + index + 1,
            url: absoluteUrl(`/products/${product.id}`), name: product.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "All Products", item: shopUrl },
        ],
      },
    ],
  };

  return (
    <main className="collection-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="collection-wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span><span>All Products</span>
        </nav>
        <header className="collection-header">
          <p className="eyebrow"><span /> Shop all</p>
          <h1>All products</h1>
          <p>{INTRO}</p>
        </header>

        <section id="products" className="collection-products" aria-labelledby="products-title">
          <div className="collection-title-row">
            <h2 id="products-title">{products.length} {products.length === 1 ? "design" : "designs"}</h2>
            <span className="showing-count">{products.length ? `Showing ${showingFrom}–${showingTo} of ${products.length}` : ""}</span>
          </div>
          {typeOptions.length > 1 && (
            <>
              <p className="filter-group-label" id="type-filter-label">Product type</p>
              <div className="filter-chips" role="group" aria-labelledby="type-filter-label">
                <Link className="chip" aria-current={!activeType} href={pageHref({ type: "" })}>All types</Link>
                {typeOptions.map((option) => (
                  <Link key={option} className="chip" aria-current={activeType === option} href={pageHref({ type: option })}>{option}</Link>
                ))}
              </div>
            </>
          )}
          <div className="filter-bar">
            <label htmlFor="collection-sort">Sort by</label>
            <SortSelect current={query.sort ?? "popular"} />
          </div>
          {!visible.length && (
            <p className="showing-count">No designs match those filters. <Link href="/shop#products">Clear filters</Link></p>
          )}

          <div className="collection-grid">
            {visible.map((product) => {
              const image = imageFor(product);
              const price = priceFor(product);
              return (
                <Link href={`/products/${product.id}`} className="collection-product" key={product.id}>
                  <div>{image && <Image src={image.src} alt={product.title} fill sizes="(min-width: 1000px) 25vw, (min-width: 600px) 33vw, 50vw" className="object-contain" />}</div>
                  <h3>{product.title}</h3>
                  <p>{price === null ? "See options" : `From $${(price / 100).toFixed(2)}`}</p>
                </Link>
              );
            })}
          </div>

          {pageCount > 1 && (
            <nav className="pagination" aria-label="Product pages">
              {page > 1 && <Link className="page-nav" href={pageHref({ page: page - 1 })}>← Previous</Link>}
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <Link
                  aria-current={number === page ? "page" : undefined}
                  href={pageHref({ page: number })}
                  key={number}
                >{number}</Link>
              ))}
              {page < pageCount && <Link className="page-nav" href={pageHref({ page: page + 1 })}>Next →</Link>}
            </nav>
          )}
        </section>

        <section className="collection-promise" aria-labelledby="promise-title">
          <h2 id="promise-title">Original designs. Made to be noticed.</h2>
          <div>
            <article><span>↺</span><h3>Order with confidence</h3><p>If something isn&apos;t right, we&apos;ll work with you to make it right.</p></article>
            <article><span>✦</span><h3>Designed in-house</h3><p>Every design starts in the Wear The Risk studio.</p></article>
            <article><span>✓</span><h3>Secure shopping</h3><p>Your account and checkout information are protected.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
