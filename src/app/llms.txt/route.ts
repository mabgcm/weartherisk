import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const { products, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const categoryLines = categories
    .filter((category) => productsForStoreCategory(products, category).length > 0)
    .map((category) => `- [${category.title}](${SITE_URL}/categories/${category.slug}): ${category.intro}`);
  const productLines = products.map((product) => `- [${product.title}](${SITE_URL}/products/${product.id})`);
  const content = [`# ${SITE_NAME}`, "", "Can Print Store is a Canadian online store for original made-to-order gifts, apparel, mugs, art prints, accessories, and home décor. Prices are in CAD. Products are created after ordering and fulfilled by specialist print partners.", "", "## Important pages", `- [Home](${SITE_URL})`, `- [About](${SITE_URL}/about)`, `- [Shipping and returns](${SITE_URL}/shipping)`, `- [Frequently asked questions](${SITE_URL}/faq)`, "", "## Product categories", ...categoryLines, "", "## Current products", ...productLines, "", "## Source of truth", "Product availability, variants, prices, and images on each linked product page are the current source of truth."].join("\n");
  return new Response(content, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
