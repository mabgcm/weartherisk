import type { MetadataRoute } from "next";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { productsForStoreCategory } from "@/lib/catalog/categories";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getStorefrontCatalog().catch(() => ({ products: [], categories: [] }));
  const populatedCategories = categories.filter((category) => productsForStoreCategory(products, category).length > 0);
  return [
    { url: SITE_URL, changeFrequency: "daily" as const, priority: 1 },
    ...populatedCategories.map((category) => ({ url: `${SITE_URL}/categories/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${SITE_URL}/products/${product.id}`, changeFrequency: "weekly" as const, priority: 0.7, images: product.images.slice(0, 4).map((image) => image.src) })),
    ...["/about", "/faq", "/shipping", "/privacy", "/terms"].map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
