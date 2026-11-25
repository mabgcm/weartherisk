import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PrintifyProduct } from "@/lib/printify/client";
import { PRODUCT_COLLECTION_SLUGS, PRODUCT_THEME_SLUGS, collectionBySlug, productsForCollection, themeSlugForProduct } from "@/lib/catalog/collections";
import { SortSelect } from "@/components/sort-select";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, metaDescription, safeJsonLd } from "@/lib/seo";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: string; page?: string; type?: string; series?: string; theme?: string }> }

function imageFor(product?: PrintifyProduct) { return product?.images.find((image) => image.is_default) ?? product?.images[0]; }
function priceFor(product: PrintifyProduct) { const prices = product.variants.filter((variant) => variant.is_enabled && variant.is_available).map((variant) => variant.price); return prices.length ? Math.min(...prices) : null; }

/** Shopper-facing product type, derived from the product title. */
function typeOf(product: PrintifyProduct): string {
  const title = product.title;
  if (/trucker/i.test(title)) return "Trucker hats";
  if (/\bcap\b|\bhat\b/i.test(title)) return "Caps";
  if (/mug|tumbler/i.test(title)) return "Mugs";
  if (/magnet/i.test(title)) return "Car magnets";
  if (/tote|backpack|duffel|\bbag\b/i.test(title)) return "Bags";
  return "Apparel";
}

/** WoW / Gamer series grouping, derived from the product title. */
function seriesOf(product: PrintifyProduct): string {
  const title = product.title;
  if (/rank/i.test(title)) return "PvP ranks";
  if (/class/i.test(title)) return "Classes";
  if (/race crest/i.test(title)) return "Race crests";
  if (/role/i.test(title)) return "Roles";
  if (/trucker hat/i.test(title)) return "Slogan truckers";
  if (/legendary/i.test(title)) return "Legendary weapons";
  return "Icons & crests";
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const collection = collectionBySlug(slug);
  if (!collection) return {};
  const { products: allProducts } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const page = Math.max(1, Number(query.page) || 1);
  const baseTitle = `${collection.title} — shop by mood`;
  const title = page > 1 ? `${baseTitle} – Page ${page}` : baseTitle;
  const description = metaDescription(`${collection.tagline} ${collection.blurb}`);
  const cover = imageFor(productsForCollection(allProducts, collection)[0]);
  const images = cover ? [{ url: cover.src, alt: collection.title }] : [];
  return {
    title,
    description,
    keywords: [collection.title, "statement gifts", "funny gifts Canada", SITE_NAME],
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { type: "website", url: `/collections/${slug}`, siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, images },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description, images: images.map((image) => image.url) },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();

  const { products: allProducts } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const allInCollection = productsForCollection(allProducts, collection);
  if (!allInCollection.length) notFound();

  const showSeries = slug === "wow" || slug === "gamer";
  const typeOptions = [...new Set(allInCollection.map(typeOf))];
  const seriesOptions = showSeries ? [...new Set(allInCollection.map(seriesOf))] : [];
  const showThemes = (PRODUCT_COLLECTION_SLUGS as readonly string[]).includes(slug);
  const themeOptions = showThemes
    ? PRODUCT_THEME_SLUGS.filter((themeSlug) => allInCollection.some((product) => themeSlugForProduct(product) === themeSlug))
    : [];
  const activeType = query.type && typeOptions.includes(query.type) ? query.type : undefined;
  const activeSeries = query.series && seriesOptions.includes(query.series) ? query.series : undefined;
  const activeTheme = query.theme && (themeOptions as readonly string[]).includes(query.theme) ? query.theme : undefined;
  const products = allInCollection.filter((product) =>
    (!activeType || typeOf(product) === activeType) && (!activeSeries || seriesOf(product) === activeSeries) &&
    (!activeTheme || themeSlugForProduct(product) === activeTheme));

  const pageHref = (overrides: { page?: number; sort?: string; type?: string; series?: string; theme?: string }) => {
    const params = new URLSearchParams();
    const sort = overrides.sort !== undefined ? overrides.sort : query.sort;
    const type = overrides.type !== undefined ? overrides.type : activeType;
    const series = overrides.series !== undefined ? overrides.series : activeSeries;
    const theme = overrides.theme !== undefined ? overrides.theme : activeTheme;
    const targetPage = overrides.page !== undefined ? overrides.page : 1;
    if (sort) params.set("sort", sort);
    if (type) params.set("type", type);
    if (series) params.set("series", series);
    if (theme) params.set("theme", theme);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/collections/${slug}${qs ? `?${qs}` : ""}#products`;
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

  const collectionUrl = absoluteUrl(`/collections/${slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${collectionUrl}#collection`,
        name: `${collection.title} | ${SITE_NAME}`, description: collection.blurb, url: collectionUrl,
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
          { "@type": "ListItem", position: 2, name: "Collections", item: absoluteUrl("/#moods") },
          { "@type": "ListItem", position: 3, name: collection.title, item: collectionUrl },
        ],
      },
    ],
  };

  return (
    <main className="collection-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="collection-wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span><Link href="/#collections">Collections</Link><span>›</span><span>{collection.title}</span>
        </nav>
        <header className="collection-header">
          <p className="eyebrow"><span /> Shop by mood</p>
          <h1>{collection.title}</h1>
          <p>{collection.tagline} {collection.blurb}</p>
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
          {themeOptions.length > 0 && (
            <>
              <p className="filter-group-label" id="theme-filter-label">Theme</p>
              <div className="filter-chips" role="group" aria-labelledby="theme-filter-label">
                <Link className="chip" aria-current={!activeTheme} href={pageHref({ theme: "" })}>All {collection.title.toLowerCase()}</Link>
                {themeOptions.map((themeSlug) => (
                  <Link key={themeSlug} className="chip" aria-current={activeTheme === themeSlug} href={pageHref({ theme: themeSlug })}>{collectionBySlug(themeSlug)?.title} {collection.title}</Link>
                ))}
              </div>
            </>
          )}
          {seriesOptions.length > 1 && (
            <>
              <p className="filter-group-label" id="series-filter-label">Series</p>
              <div className="filter-chips" role="group" aria-labelledby="series-filter-label">
                <Link className="chip" aria-current={!activeSeries} href={pageHref({ series: "" })}>All series</Link>
                {seriesOptions.map((option) => (
                  <Link key={option} className="chip" aria-current={activeSeries === option} href={pageHref({ series: option })}>{option}</Link>
                ))}
              </div>
            </>
          )}
          <div className="filter-bar">
            <label htmlFor="collection-sort">Sort by</label>
            <SortSelect current={query.sort ?? "popular"} />
          </div>
          {!visible.length && (
            <p className="showing-count">No designs match those filters. <Link href={`/collections/${slug}#products`}>Clear filters</Link></p>
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
