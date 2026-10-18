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

export const THEME_COLLECTIONS: readonly ThemeCollection[] = [
  {
    slug: "entrepreneur",
    title: "Entrepreneur",
    tagline: "Funded by dreams. Powered by caffeine.",
    blurb: "For founders, freelancers and startup survivors. Investor jokes, hustle culture and the pre-seed grind — printed.",
    keywords: ["startup", "entrepreneur", "investor", "investors", "founder", "funding", "hustle", "ceo", "seed"],
    color: "#e76f51",
  },
  {
    slug: "gamer",
    title: "Gamer",
    tagline: "GG go next.",
    blurb: "For ranked grinders and tilt survivors. Sarcastic gamer statements — keep calm and blame the jungler, printed.",
    keywords: ["gamer", "gaming", "gg", "noob", "respawn", "moba", "esports", "tilt", "jungler", "ranked", "clutch"],
    color: "#7b2ff7",
  },
  {
    slug: "pumpkin-face",
    title: "Pumpkin Face",
    tagline: "The jack-o'-lantern edit.",
    blurb: "Pumpkin-face designs for Halloween — classic, goofy and glowing. Pick your face for the season.",
    keywords: ["pumpkin", "jack-o-lantern", "jack o lantern"],
    seasonal: true,
    color: "#f4a259",
  },
  {
    slug: "ghost",
    title: "Ghost",
    tagline: "Boo, but make it fashion.",
    blurb: "Ghost designs for the spooky season — friendly frights and haunted humor, printed.",
    keywords: ["ghost", "phantom", "specter", "spectre", "haunted"],
    seasonal: true,
    color: "#b8c0cc",
  },
  {
    slug: "mummy-face",
    title: "Mummy Face",
    tagline: "Wrapped up in Halloween.",
    blurb: "Mummy-face designs — wrapped, winking and ready for trick or treat.",
    keywords: ["mummy"],
    seasonal: true,
    color: "#d8cfc0",
  },
  {
    slug: "halloween",
    title: "Halloween",
    tagline: "The rest of the haunted house.",
    blurb: "The remaining Halloween crew — witches, vampires, candy security and costume chaos. Pumpkin, mummy and ghost faces have their own collections; bags and mugs too.",
    keywords: ["halloween", "spooky", "witch", "vampire", "candy", "costume", "horror", "october", "trick", "boo", "creepy", "scary", "terror", "monster", "eerie"],
    excludeKeywords: ["pumpkin", "mummy", "ghost", "tote", "bag", "mug"],
    seasonal: true,
    color: "#9b5de5",
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
