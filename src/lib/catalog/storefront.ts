import "server-only";
import { cache } from "react";

import { categoriesForProducts, categoryForProduct } from "@/lib/catalog/categories";
import { getPrintifyBlueprint, getPrintifyProducts } from "@/lib/printify/client";

export const getStorefrontCatalog = cache(async () => {
  const products = await getPrintifyProducts();
  const unmatchedBlueprintIds = [...new Set(
    products.filter((product) => !categoryForProduct(product)).map((product) => product.blueprint_id),
  )];
  const blueprints = (await Promise.all(
    unmatchedBlueprintIds.map((blueprintId) => getPrintifyBlueprint(blueprintId).catch(() => null)),
  )).filter((blueprint) => blueprint !== null);

  return { products, categories: categoriesForProducts(products, blueprints) };
});
