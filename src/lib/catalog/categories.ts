import type { PrintifyBlueprint, PrintifyProduct } from "@/lib/printify/client";

export interface StoreCategory {
  slug: string;
  title: string;
  singular: string;
  blueprintIds: readonly number[];
  fallbackMatcher: RegExp;
  intro: string;
  seoTitle: string;
  seoBody: string;
  subcategories: readonly { label: string; blueprintIds: readonly number[] }[];
  styles: readonly string[];
  color: string;
}

/**
 * Printify exposes product types as blueprint IDs rather than a storefront
 * category tree. This table is the store's canonical blueprint → category map.
 * Add a blueprint ID here once; every category surface will use it.
 */
export const STORE_CATEGORIES: readonly StoreCategory[] = [
  {
    slug: "t-shirts", title: "Apparel", singular: "apparel piece", color: "#f58a73",
    blueprintIds: [6, 39, 77, 706, 1296], fallbackMatcher: /shirt|t-shirt|tee|tank|hoodie|sweatshirt|apparel/i,
    intro: "Original tees and easy layers made to say something about you.", seoTitle: "Original made-to-order apparel", seoBody: "Explore original graphic T-shirts and comfortable made-to-order apparel. Choose your preferred fit and colour, then order a design produced especially for you.",
    subcategories: [
      { label: "T-Shirts", blueprintIds: [6, 706] },
      { label: "Tank tops", blueprintIds: [39] },
      { label: "Hoodies", blueprintIds: [77] },
      { label: "Sweatshirts", blueprintIds: [1296] },
      { label: "Embroidered", blueprintIds: [] },
      { label: "Best sellers", blueprintIds: [] },
    ], styles: ["Minimal", "Streetwear", "Retro", "Botanical", "Dark art", "Typography"],
  },
  {
    slug: "mugs", title: "Mugs", singular: "mug", color: "#b8ccad",
    blueprintIds: [68,70,289,353,425,441,478,479,483,503,535,583,595,604,612,618,620,628,635,693,746,791,891,896,930,966,985,1016,1017,1018,1088,1126,1131,1151,1152,1154,1156,1160,1235,1244,1248,1301,1302,1335,1340,1394,1498,1507,1508,1509,1511,1513,1514,1515,1519,1610,1662,1670,1680,1682,1705,1715,1927,1972,2044,2692,2693,2740,2762], fallbackMatcher: /mug|tumbler|drinkware|cup|stein/i,
    intro: "Morning favourites and expressive mugs designed to make every coffee break feel more like yours.", seoTitle: "Original mugs and drinkware", seoBody: "Discover original mugs and drinkware made to order for everyday gifting, celebrations and small moments that deserve to be remembered.",
    subcategories: [
      { label: "Coffee mugs", blueprintIds: [68,289,425,441,478,479,503,535,583,595,612,618,628,635,896,930,985,1016,1017,1018,1126,1151,1152,1156,1244,1301,1302,1680,1682,1705,2692,2693] },
      { label: "Travel mugs", blueprintIds: [70,604,693,966,1154,1160,1498,1511,1513,1514,1715] },
      { label: "Tumblers", blueprintIds: [353,620,746,1235,1248,1335,1340,1394,1507,1508,1509,1515,1519,1610,1662,1670,1927,2044,2740] },
      { label: "Beer mugs", blueprintIds: [483,891,1088,1131,2762] },
      { label: "Graphic mugs", blueprintIds: [] }, { label: "Best sellers", blueprintIds: [] },
    ], styles: ["Modern minimal", "Simple", "Unique", "Colourful", "Family photo", "Pets"],
  },
  {
    slug: "art-prints", title: "Art Prints", singular: "art print", color: "#cfc2e7",
    blueprintIds: [97,282,284,443,492,493,540,541,554,555,763,764,804,829,852,900,937,944,1033,1061,1068,1079,1130,1140,1159,1191,1220,1226,1236,1238,1267,1275,1297,1309,1331,1502,1697], fallbackMatcher: /poster|canvas|wall art|art print/i,
    intro: "Expressive artwork for walls that deserve more personality—from graphic statements to thoughtful gifts.", seoTitle: "Original art prints for expressive spaces", seoBody: "Discover art prints designed to bring warmth, colour and personality to your space. Each design is produced on demand so you can choose meaningful wall art without unnecessary overproduction.",
    subcategories: [{ label: "Posters", blueprintIds: [97,282,284,443,554,763,804,829,852,1033,1068,1079,1191,1220,1267,1309,1331,1697] },{ label: "Framed prints", blueprintIds: [492,493,540,541,764,1130,1140,1236,1275,1502] },{ label: "Canvas", blueprintIds: [555,900,937,944,1061,1159,1226,1238,1297] },{ label: "Typography", blueprintIds: [] },{ label: "Botanical", blueprintIds: [] },{ label: "Best sellers", blueprintIds: [] }], styles: ["Modern", "Colourful", "Soft neutral", "Graphic", "Playful", "Vintage"],
  },
  {
    slug: "accessories", title: "Accessories", singular: "accessory", color: "#f0b9a9",
    blueprintIds: [268,269,507,553,609,707,731,826,836,1022,1090,1092,1148,1273,1288,1300,1313,1389,1658,1717,1920,1990,2021,5349], fallbackMatcher: /phone case|tote|bag|accessor/i,
    intro: "Useful, expressive extras for the everyday—designed to protect, carry and show a little personality.", seoTitle: "Original accessories made to order", seoBody: "Shop expressive phone cases, bags and everyday accessories featuring original Printstore artwork, produced on demand especially for your order.",
    subcategories: [{ label: "Phone cases", blueprintIds: [268,269,1022,1273,1658] },{ label: "Tote bags", blueprintIds: [507,553,609,707,731,826,836,1090,1092,1288,1300,1313,1389,1717,1920,1990,2021,5349] },{ label: "Travel bags", blueprintIds: [1148,1288] },{ label: "Tech accessories", blueprintIds: [268,269,1022,1273,1658] },{ label: "Best sellers", blueprintIds: [] },{ label: "All accessories", blueprintIds: [] }], styles: ["Graphic", "Botanical", "Minimal", "Colourful", "Retro", "Monogram"],
  },
  {
    slug: "home-living", title: "Home & Living", singular: "home piece", color: "#a9c8c0",
    blueprintIds: [220,223,229,232,238,295,522,538,575,585,717,736,744,809,810,844,870,918,927,993,996,1001,1007,1044,1051,1091,1105,1120,1124,1133,1328,1337,1380,1385,1491,1493,1500,1572,1590,1626,1642,1650,1911,2650,2668,2697,2714,2758,2795,3192,5346], fallbackMatcher: /pillow|blanket|home|decor|cushion/i,
    intro: "Original details that make a room feel considered, collected and completely your own.", seoTitle: "Made-to-order home décor and gifts", seoBody: "Find made-to-order home décor, soft furnishings and thoughtful pieces designed to add personality without disposable trends.",
    subcategories: [{ label: "Pillows", blueprintIds: [220,223,229,232,295,538,809,810,844,870,996,1001,1007,1380,1572,1590,1650,2668,2697,2758] },{ label: "Blankets", blueprintIds: [238,522,575,585,717,736,744,918,927,993,1044,1051,1091,1105,1120,1124,1133,1328,1337,1385,1491,1493,1500,1626,1642,1911,2650,2714,2795,3192,5346] },{ label: "Home décor", blueprintIds: [] },{ label: "Housewarming", blueprintIds: [] },{ label: "Best sellers", blueprintIds: [] },{ label: "All home", blueprintIds: [] }], styles: ["Warm minimal", "Modern", "Botanical", "Playful", "Monochrome", "Textured"],
  },
] as const;

export function productBelongsToCategory(product: PrintifyProduct, category: StoreCategory) {
  if (category.blueprintIds.includes(product.blueprint_id)) return true;
  return category.fallbackMatcher.test(`${product.title} ${product.tags.join(" ")}`);
}
export function productsForCategory(products: PrintifyProduct[], slug: string) {
  const category = STORE_CATEGORIES.find((item) => item.slug === slug);
  return category ? products.filter((product) => productBelongsToCategory(product, category)) : [];
}
export function categoryForProduct(product: PrintifyProduct) { return STORE_CATEGORIES.find((category) => productBelongsToCategory(product, category)); }

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "products";
}

/** Adds one storefront category for each published Printify blueprint not covered above. */
export function categoriesForProducts(products: PrintifyProduct[], blueprints: PrintifyBlueprint[] = []): StoreCategory[] {
  const categories = [...STORE_CATEGORIES];
  const knownBlueprintIds = new Set(categories.flatMap((category) => [...category.blueprintIds]));
  const blueprintTitles = new Map(blueprints.map((blueprint) => [blueprint.id, blueprint.title]));
  const unmatchedIds = [...new Set(
    products
      .filter((product) => !categoryForProduct(product) && !knownBlueprintIds.has(product.blueprint_id))
      .map((product) => product.blueprint_id),
  )];
  const usedSlugs = new Set(categories.map((category) => category.slug));

  for (const blueprintId of unmatchedIds) {
    const sample = products.find((product) => product.blueprint_id === blueprintId);
    const title = blueprintTitles.get(blueprintId) ?? sample?.tags[0] ?? `Products ${blueprintId}`;
    const baseSlug = slugify(title);
    const slug = usedSlugs.has(baseSlug) ? `${baseSlug}-${blueprintId}` : baseSlug;
    usedSlugs.add(slug);
    categories.push({
      slug,
      title,
      singular: title.toLowerCase(),
      blueprintIds: [blueprintId],
      fallbackMatcher: new RegExp(`(?!)`),
      intro: `Explore our made-to-order ${title.toLowerCase()}, featuring original Printstore designs.`,
      seoTitle: `${title} made to order`,
      seoBody: `Discover original ${title.toLowerCase()} produced on demand and made especially for you.`,
      subcategories: [{ label: `All ${title}`, blueprintIds: [blueprintId] }],
      styles: ["New arrivals", "Original designs", "Made to order"],
      color: ["#f58a73", "#b8ccad", "#cfc2e7", "#a9c8c0"][categories.length % 4],
    });
  }

  return categories;
}

export function productsForStoreCategory(products: PrintifyProduct[], category: StoreCategory) {
  return products.filter((product) => productBelongsToCategory(product, category));
}
