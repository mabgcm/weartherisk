import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PrintifyProduct } from "@/lib/printify/client";
import { newArrivals } from "@/lib/catalog/collections";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME } from "@/lib/seo";

interface Props { searchParams: Promise<{ q?: string; sort?: string }> }

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search",
  description: `Search original statement apparel, mugs, art prints and gifts at ${SITE_NAME}.`,
  robots: { index: false, follow: true },
};

function imageFor(product?: PrintifyProduct) { return product?.images.find((image) => image.is_default) ?? product?.images[0]; }
function priceFor(product: PrintifyProduct) { const prices = product.variants.filter((variant) => variant.is_enabled && variant.is_available).map((variant) => variant.price); return prices.length ? Math.min(...prices) : null; }

function matches(product: PrintifyProduct, terms: string[]): boolean {
  const text = `${product.title} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  return terms.every((term) => text.includes(term));
}

export default async function SearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = (query.q ?? "").trim();
  const { products } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));

  let results: PrintifyProduct[] = [];
  let heading = "Search the store";
  let subheading = "Type a word, a mood or an occasion — we'll find the sentence for it.";
  if (query.sort === "new") {
    results = newArrivals(products, 24);
    heading = "New arrivals";
    subheading = "The freshest designs, latest first.";
  } else if (q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    results = products.filter((product) => matches(product, terms));
    heading = `Results for "${q}"`;
    subheading = `${results.length} ${results.length === 1 ? "design" : "designs"} found.`;
  }

  return (
    <main className="collection-page">
      <div className="collection-wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><span>Search</span></nav>
        <header className="collection-header">
          <p className="eyebrow"><span /> Find your sentence</p>
          <h1>{heading}</h1>
          <p>{subheading}</p>
        </header>
        <form className="search-form" role="search" action="/search" method="get">
          <label className="sr-only" htmlFor="site-search">Search products</label>
          <input id="site-search" name="q" type="search" defaultValue={q} placeholder="Try &quot;office&quot;, &quot;gym&quot;, &quot;halloween&quot;…" autoComplete="off" />
          <button type="submit">Search</button>
        </form>
        {(q || query.sort === "new") && (
          results.length ? (
            <div className="collection-grid search-results">
              {results.map((product) => {
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
          ) : (
            <div className="collection-empty">
              <span>✦</span>
              <h3>Nothing with that attitude yet.</h3>
              <p>Try a different word — or browse the moods and let a design find you.</p>
              <Link href="/#moods" className="button button-dark">Shop by mood →</Link>
            </div>
          )
        )}
      </div>
    </main>
  );
}
