import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PrintifyProduct } from "@/lib/printify/client";
import { collectionBySlug, productsForCollection } from "@/lib/catalog/collections";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, metaDescription, safeJsonLd } from "@/lib/seo";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: string; page?: string }> }

function imageFor(product?: PrintifyProduct) { return product?.images.find((image) => image.is_default) ?? product?.images[0]; }
function priceFor(product: PrintifyProduct) { const prices = product.variants.filter((variant) => variant.is_enabled && variant.is_available).map((variant) => variant.price); return prices.length ? Math.min(...prices) : null; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) return {};
  const description = metaDescription(`${collection.tagline} ${collection.blurb}`);
  return {
    title: `${collection.title} — shop by mood`,
    description,
    keywords: [collection.title, "statement gifts", "funny gifts Canada", SITE_NAME],
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { type: "website", url: `/collections/${slug}`, siteName: SITE_NAME, title: `${collection.title} | ${SITE_NAME}`, description },
    twitter: { card: "summary_large_image", title: collection.title, description },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();

  const { products: allProducts } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const products = productsForCollection(allProducts, collection);
  if (!products.length) notFound();

  if (query.sort === "price-low") products.sort((a, b) => (priceFor(a) ?? Infinity) - (priceFor(b) ?? Infinity));
  if (query.sort === "price-high") products.sort((a, b) => (priceFor(b) ?? -Infinity) - (priceFor(a) ?? -Infinity));
  if (query.sort === "name") products.sort((a, b) => a.title.localeCompare(b.title));
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = 12;
  const pageCount = Math.max(1, Math.ceil(products.length / perPage));
  const visible = products.slice((page - 1) * perPage, page * perPage);

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
          <Link href="/">Home</Link><span>›</span><Link href="/#moods">Collections</Link><span>›</span><span>{collection.title}</span>
        </nav>
        <header className="collection-header">
          <p className="eyebrow"><span /> Shop by mood</p>
          <h1>{collection.title}</h1>
          <p>{collection.tagline} {collection.blurb}</p>
        </header>

        <section id="products" className="collection-products" aria-labelledby="products-title">
          <div className="collection-title-row">
            <h2 id="products-title">{products.length} {products.length === 1 ? "design" : "designs"}</h2>
            <span>{collection.seasonal ? "Limited season" : "Made to order"}</span>
          </div>
          <form className="filter-bar">
            <label htmlFor="collection-sort">Sort by</label>
            <select id="collection-sort" name="sort" defaultValue={query.sort ?? "popular"}>
              <option value="popular">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
            <button type="submit">Apply</button>
          </form>

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
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <Link
                  aria-current={number === page ? "page" : undefined}
                  href={`/collections/${slug}?page=${number}${query.sort ? `&sort=${query.sort}` : ""}#products`}
                  key={number}
                >{number}</Link>
              ))}
            </nav>
          )}
        </section>

        <section className="collection-promise" aria-labelledby="promise-title">
          <h2 id="promise-title">Made to order. Made for you.</h2>
          <div>
            <article><span>↺</span><h3>Order with confidence</h3><p>If something isn&apos;t right, we&apos;ll work with you to make it right.</p></article>
            <article><span>✦</span><h3>Made only for you</h3><p>Your order starts production, helping prevent unnecessary stock.</p></article>
            <article><span>✓</span><h3>Secure shopping</h3><p>Your account and checkout information are protected.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
