import type { PrintifyProduct } from "@/lib/printify/client";

/**
 * Theme collections for Wear The Risk.
 *
 * Each collection is defined by keyword matchers tested against the product
 * title and its Printify tags, so groups form automatically as products are
 * added or tagged — no code change needed.
 *
 * To place a product in a collection, add one of its keywords as a tag in
 * Printify (e.g. tag "jungler" puts the product in Gamer). Title keywords
 * work too, but tags are the reliable route.
 *
 * Apparel rule: theme collections are clothing-only. Non-apparel products
 * (mugs, tumblers, bags, car magnets) live only in their own collections
 * below, so a Christmas mug shows under Mugs — not inside Christmas.
 */
export interface ThemeCollection {
  slug: string;
  title: string;
  tagline: string;
  blurb: string;
  keywords: string[];
  /** Products matching these keywords stay OUT of the collection (word-boundary, case-insensitive). */
  excludeKeywords?: string[];
  /** Seasonal collections show a "Limited season" label on their page. */
  seasonal?: boolean;
  color: string;
}

/** Keywords that mark a product as non-apparel; theme collections exclude them. */
const NON_APPAREL_KEYWORDS = ["mug", "tumbler", "tote", "bag", "backpack", "duffel", "magnet"];

export const THEME_COLLECTIONS: readonly ThemeCollection[] = [
  {
    slug: "christmas",
    title: "Christmas",
    tagline: "Sleigh the season, say the thing.",
    blurb: "Holiday statements for people who think it before the eggnog — vintage Santas, honest slogans and zero silent nights.",
    keywords: ["christmas", "xmas", "santa"],
    excludeKeywords: [...NON_APPAREL_KEYWORDS, "halloween", "pumpkin", "mummy"],
    seasonal: true,
    color: "#a41623",
  },
  {
    slug: "entrepreneur",
    title: "Entrepreneur",
    tagline: "Funded by dreams. Powered by caffeine.",
    blurb: "For founders, freelancers and startup survivors. Investor jokes, hustle culture and the pre-seed grind — printed.",
    keywords: ["startup", "entrepreneur", "investor", "investors", "founder", "funding", "hustle", "ceo", "seed"],
    excludeKeywords: NON_APPAREL_KEYWORDS,
    color: "#e76f51",
  },
  {
    slug: "gamer",
    title: "Gamer",
    tagline: "GG go next.",
    blurb: "For ranked grinders and tilt survivors. Sarcastic gamer statements — keep calm and blame the jungler, printed.",
    keywords: ["gamer", "gaming", "gg", "noob", "respawn", "moba", "esports", "tilt", "jungler", "ranked", "clutch"],
    excludeKeywords: [...NON_APPAREL_KEYWORDS, "lol", "league of legends"],
    color: "#7b2ff7",
  },
  {
    slug: "wow",
    title: "WoW",
    tagline: "For the Horde. For the Alliance.",
    blurb: "Gamer / WoW — the complete classic PvP rank series, all 13 class icons, slogan truckers, race crests and legendary weapons, embroidered. Every rank from Private / Scout up to Grand Marshal / High Warlord.",
    keywords: ["wow"],
    excludeKeywords: NON_APPAREL_KEYWORDS,
    color: "#f0b429",
  },
  {
    slug: "league-of-legends",
    title: "LoL",
    tagline: "Your rank, worn properly.",
    blurb: "Gamer / LoL — the complete League of Legends rank series, Iron to Challenger, on Richardson 112 truckers. Embroidered or full-colour printed, with the original crest artwork.",
    keywords: ["lol", "league of legends"],
    excludeKeywords: NON_APPAREL_KEYWORDS,
    color: "#0397ab",
  },
  {
    slug: "christmas-gifts",
    title: "Christmas Gifts",
    tagline: "Gifts that say the thing.",
    blurb: "Gift-ready Christmas picks — holiday statements on apparel, mugs, bags and more. Made to order, designed to be noticed.",
    keywords: ["christmas", "xmas", "santa"],
    seasonal: true,
    color: "#a41623",
  },
  {
    slug: "gifts-for-wow-gamers",
    title: "Gifts for WoW Gamers",
    tagline: "For the WoW player who has everything but this.",
    blurb: "Gift-ready picks for World of Warcraft players — rank, class and slogan caps, legendary weapons, mugs and more. Made to order, designed to be noticed.",
    keywords: ["wow"],
    color: "#f0b429",
  },
  {
    slug: "gifts-for-lol-gamers",
    title: "Gifts for LoL Gamers",
    tagline: "For the LoL player who has everything but this.",
    blurb: "Gift-ready picks for League of Legends players — every rank crest from Iron to Challenger on hats, mugs, tech cases, stickers and more. Made to order, designed to be noticed.",
    keywords: ["lol", "league of legends"],
    color: "#0397ab",
  },
  {
    slug: "bags",
    title: "Bags",
    tagline: "Carry the statement.",
    blurb: "Tote bags that say it for you — groceries, gym and everyday errands with a punchline.",
    keywords: ["tote", "bag", "backpack", "duffel"],
    color: "#8a6f4d",
  },
  {
    slug: "mugs",
    title: "Mugs",
    tagline: "Sip happens.",
    blurb: "Mugs for the sentences you think before coffee. Dishwasher-safe honesty.",
    keywords: ["mug", "tumbler"],
    color: "#a9c8c0",
  },
  {
    slug: "car-magnets",
    title: "Car Magnets",
    tagline: "Say it in traffic.",
    blurb: "Car magnets with something to say — for tailgaters, gamers and everyone stuck behind you.",
    keywords: ["magnet"],
    color: "#5b8e7d",
  },
  {
    slug: "hats",
    title: "Hats",
    tagline: "Say it on your head.",
    blurb: "Trucker hats and caps with something to say — embroidered slogans, ranked emblems and zero small talk.",
    keywords: ["hat", "cap", "trucker"],
    color: "#457b9d",
  },
  {
    slug: "pumpkin-face",
    title: "Pumpkin Face",
    tagline: "The jack-o'-lantern edit.",
    blurb: "Pumpkin-face designs for Halloween — classic, goofy and glowing. Pick your face for the season.",
    keywords: ["pumpkin", "jack-o-lantern", "jack o lantern"],
    excludeKeywords: [...NON_APPAREL_KEYWORDS, "christmas", "xmas", "santa"],
    seasonal: true,
    color: "#f4a259",
  },
  {
    slug: "ghost",
    title: "Ghost",
    tagline: "Boo, but make it fashion.",
    blurb: "Ghost designs for the spooky season — friendly frights and haunted humor, printed.",
    keywords: ["ghost", "phantom", "specter", "spectre", "haunted"],
    excludeKeywords: [...NON_APPAREL_KEYWORDS, "christmas", "xmas", "santa", "investor", "investors", "startup", "entrepreneur"],
    seasonal: true,
    color: "#b8c0cc",
  },
  {
    slug: "mummy-face",
    title: "Mummy Face",
    tagline: "Wrapped up in Halloween.",
    blurb: "Mummy-face designs — wrapped, winking and ready for trick or treat.",
    keywords: ["mummy"],
    excludeKeywords: [...NON_APPAREL_KEYWORDS, "christmas", "xmas", "santa"],
    seasonal: true,
    color: "#d8cfc0",
  },
  {
    slug: "halloween",
    title: "Halloween",
    tagline: "The rest of the haunted house.",
    blurb: "The remaining Halloween crew — witches, vampires, candy security and costume chaos. Pumpkin, mummy and ghost faces have their own collections; bags, mugs and magnets too.",
    keywords: ["halloween", "spooky", "witch", "vampire", "candy", "costume", "horror", "october", "trick", "boo", "creepy", "scary", "terror", "monster", "eerie"],
    excludeKeywords: ["pumpkin", "mummy", "ghost", ...NON_APPAREL_KEYWORDS, "christmas", "xmas", "santa"],
    seasonal: true,
    color: "#9b5de5",
  },
] as const;

function haystack(product: PrintifyProduct): string {
  return `${product.title} ${(product.tags ?? []).join(" ")}`.toLowerCase();
}

/** Word-boundary match so "pet" doesn't match "competitive" and "ghost" doesn't match "ghosted". */
function keywordMatches(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function productsForCollection(products: PrintifyProduct[], collection: ThemeCollection): PrintifyProduct[] {
  return products.filter((product) => {
    const text = haystack(product);
    if (!collection.keywords.some((keyword) => keywordMatches(text, keyword))) return false;
    if (collection.excludeKeywords?.some((keyword) => keywordMatches(text, keyword))) return false;
    return true;
  });
}

export function collectionBySlug(slug: string): ThemeCollection | undefined {
  return THEME_COLLECTIONS.find((collection) => collection.slug === slug);
}

/** Only collections that currently have products, in the order defined above. */
export function activeCollections(products: PrintifyProduct[]): Array<{ collection: ThemeCollection; products: PrintifyProduct[] }> {
  return THEME_COLLECTIONS.map((collection) => ({ collection, products: productsForCollection(products, collection) }))
    .filter((entry) => entry.products.length > 0);
}

/** Product-type collections shown under the Products menu. */
export const PRODUCT_COLLECTION_SLUGS = ["hats", "mugs", "bags", "car-magnets"] as const;

/** Display themes, in navigation order, used to group product collections (e.g. "WoW Bags"). */
export const PRODUCT_THEME_SLUGS = ["halloween", "christmas", "entrepreneur", "wow", "league-of-legends"] as const;

/** Gift collections shown under the Gifts menu and the homepage gifts section. */
export const GIFT_COLLECTION_SLUGS = ["christmas-gifts", "gifts-for-wow-gamers", "gifts-for-lol-gamers"] as const;

/** Collections listed on the homepage collections section: display themes first, then product types. */
export const HOMEPAGE_COLLECTION_SLUGS = [...PRODUCT_THEME_SLUGS, ...PRODUCT_COLLECTION_SLUGS] as const;

const HALLOWEEN_GROUP_KEYWORDS = [
  "halloween", "spooky", "witch", "vampire", "candy", "costume", "horror", "october", "trick", "boo", "creepy", "scary", "terror", "monster", "eerie",
  "pumpkin", "jack-o-lantern", "jack o lantern", "ghost", "phantom", "specter", "spectre", "haunted", "mummy",
];

/**
 * Display theme a product belongs to, for grouping product collections
 * (e.g. the Bags page groups into WoW Bags, LoL Bags, Christmas Bags).
 * Unlike productsForCollection this ignores the apparel-only exclusions:
 * a Christmas mug is still a Christmas product here.
 */
export function themeSlugForProduct(product: PrintifyProduct): string | undefined {
  const text = haystack(product);
  const hits = (keywords: readonly string[]) => keywords.some((keyword) => keywordMatches(text, keyword));
  if (hits(["lol", "league of legends"])) return "league-of-legends";
  if (hits(["wow"])) return "wow";
  if (hits(["christmas", "xmas", "santa"])) return "christmas";
  if (hits(["startup", "entrepreneur", "investor", "investors", "founder", "funding", "hustle", "ceo", "seed"])) return "entrepreneur";
  if (hits(HALLOWEEN_GROUP_KEYWORDS)) return "halloween";
  return undefined;
}

/** Most recently updated products, for the "new arrivals" rail. */
export function newArrivals(products: PrintifyProduct[], count = 8): PrintifyProduct[] {
  return [...products]
    .sort((a, b) => {
      const aTime = a.updated_at ? Date.parse(a.updated_at) : 0;
      const bTime = b.updated_at ? Date.parse(b.updated_at) : 0;
      return bTime - aTime;
    })
    .slice(0, count);
}
