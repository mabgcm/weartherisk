import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { activeCollections } from "@/lib/catalog/collections";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const { products, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const categoryLines = categories
    .filter((category) => productsForStoreCategory(products, category).length > 0)
    .map((category) => `- [${category.title}](${SITE_URL}/categories/${category.slug}): ${category.intro}`);
  const collectionLines = activeCollections(products)
    .map(({ collection, products: items }) => `- [${collection.title}](${SITE_URL}/collections/${collection.slug}): ${collection.tagline} (${items.length} designs)`);
  const productLines = products.map((product) => `- [${product.title}](${SITE_URL}/products/${product.id})`);
  const content = [`# ${SITE_NAME}`, "", `${SITE_NAME} is a Canadian online store for original statement gifts, apparel, mugs, art prints, accessories, and home décor. Prices are in CAD. Every design is created in-house by the Wear The Risk studio.`, "", "## Important pages", `- [Home](${SITE_URL})`, `- [About](${SITE_URL}/about)`, `- [Shipping and returns](${SITE_URL}/shipping)`, `- [Frequently asked questions](${SITE_URL}/faq)`, "", "## Theme collections (shop by mood)", ...collectionLines, "", "## Product categories", ...categoryLines, "", "## Current products", ...productLines, "", "## Source of truth", "Product availability, variants, prices, and images on each linked product page are the current source of truth."].join("\n");
  return new Response(content, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
