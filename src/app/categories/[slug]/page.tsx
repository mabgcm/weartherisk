import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PrintifyProduct } from "@/lib/printify/client";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { SITE_NAME, absoluteUrl, metaDescription, safeJsonLd } from "@/lib/seo";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: string; page?: string }> }

function imageFor(product?: PrintifyProduct) { return product?.images.find((image) => image.is_default) ?? product?.images[0]; }
function priceFor(product: PrintifyProduct) { const prices = product.variants.filter((variant) => variant.is_enabled && variant.is_available).map((variant) => variant.price); return prices.length ? Math.min(...prices) : null; }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};
  const description = metaDescription(`${category.intro} ${category.seoBody}`);
  return { title: category.seoTitle, description, keywords: [category.title, category.seoTitle, `${category.title} Canada`, "original gifts", SITE_NAME], alternates: { canonical: `/categories/${slug}` }, openGraph: { type: "website", url: `/categories/${slug}`, siteName: SITE_NAME, title: `${category.seoTitle} | ${SITE_NAME}`, description }, twitter: { card: "summary_large_image", title: category.seoTitle, description } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params; const query = await searchParams;
  const { products: allProducts, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const products = productsForStoreCategory(allProducts, category);
  if (query.sort === "price-low") products.sort((a, b) => (priceFor(a) ?? Infinity) - (priceFor(b) ?? Infinity));
  if (query.sort === "price-high") products.sort((a, b) => (priceFor(b) ?? -Infinity) - (priceFor(a) ?? -Infinity));
  if (query.sort === "name") products.sort((a, b) => a.title.localeCompare(b.title));
  const page = Math.max(1, Number(query.page) || 1); const perPage = 8; const pageCount = Math.max(1, Math.ceil(products.length / perPage)); const visible = products.slice((page - 1) * perPage, page * perPage);
  const categoryUrl = absoluteUrl(`/categories/${slug}`);
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${categoryUrl}#collection`, name: category.seoTitle, description: category.intro, url: categoryUrl, isPartOf: { "@id": `${absoluteUrl("/")}#website` }, mainEntity: { "@type": "ItemList", numberOfItems: products.length, itemListElement: visible.map((product, index) => ({ "@type": "ListItem", position: (page - 1) * perPage + index + 1, url: absoluteUrl(`/products/${product.id}`), name: product.title })) } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: category.title, item: categoryUrl }] },
  ] };

  return <main className="collection-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <div className="collection-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><span>{category.title}</span></nav>
      <header className="collection-header"><p className="eyebrow"><span /> The Wear The Risk collection</p><h1>{category.title}</h1><p>{category.intro}</p></header>

      <section id="products" className="collection-products" aria-labelledby="products-title"><div className="collection-title-row"><h2 id="products-title">Explore {category.title}</h2><span>{products.length} results</span></div>
        <form className="filter-bar"><label htmlFor="collection-sort">Sort by</label><select id="collection-sort" name="sort" defaultValue={query.sort ?? "popular"}><option value="popular">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select><button type="submit">Apply</button></form>

        {visible.length ? <div className="collection-grid">{visible.map((product) => { const image = imageFor(product); const price = priceFor(product); return <Link href={`/products/${product.id}`} className="collection-product" key={product.id}><div>{image && <Image src={image.src} alt={product.title} fill sizes="(min-width: 1000px) 25vw, (min-width: 600px) 33vw, 50vw" className="object-contain" />}</div><h3>{product.title}</h3><p>{price === null ? "See options" : `From $${(price / 100).toFixed(2)}`}</p></Link>; })}</div> : <div className="collection-empty"><span>✦</span><h3>New {category.title.toLowerCase()} are on the way.</h3><p>We&apos;re preparing this collection now. Explore another category while the studio puts on the finishing touches.</p><Link href="/#shop" className="button button-dark">Shop all products →</Link></div>}

        {pageCount > 1 && <nav className="pagination" aria-label="Product pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link aria-current={number === page ? "page" : undefined} href={`/categories/${slug}?page=${number}${query.sort ? `&sort=${query.sort}` : ""}#products`} key={number}>{number}</Link>)}</nav>}
      </section>

      <section className="collection-promise" aria-labelledby="promise-title"><h2 id="promise-title">Original designs. Made to be noticed.</h2><div><article><span>↺</span><h3>Order with confidence</h3><p>If something isn&apos;t right, we&apos;ll work with you to make it right.</p></article><article><span>✦</span><h3>Designed in-house</h3><p>Every design starts in the Wear The Risk studio.</p></article><article><span>✓</span><h3>Secure shopping</h3><p>Your account and checkout information are protected.</p></article></div></section>
      <section className="collection-seo"><h2>{category.seoTitle}</h2><p>{category.seoBody}</p><h3>How does it work?</h3><ol><li><strong>Choose a design</strong> and select an available product option.</li><li><strong>Place your order</strong> through our secure checkout.</li><li><strong>We prepare your order</strong> with our production partners.</li><li><strong>It ships to your door</strong> — track it from your account.</li></ol></section>
    </div>
  </main>;
}
