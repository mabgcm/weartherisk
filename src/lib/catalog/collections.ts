import type { PrintifyProduct } from "@/lib/printify/client";

/**
 * Theme collections ("shop by mood") for Wear The Risk.
 *
 * The brand sells statements, not product types: shoppers look for the right
 * words for an occasion or a person. Each collection is defined by keyword
 * matchers tested against the product title and its Printify tags, so groups
 * form automatically as products are added or tagged — no code change needed.
 *
 * To place a product in a collection, add one of its keywords as a tag in
 * Printify (e.g. tag "halloween" puts the product in Spooky Season). Title
 * keywords work too, but tags are the reliable route.
 */
export interface ThemeCollection {
  slug: string;
  title: string;
  tagline: string;
  blurb: string;
  keywords: string[];
  /** Seasonal collections only render when they have products. */
  seasonal?: boolean;
  /** Featured collections get a dedicated homepage spotlight. */
  featured?: boolean;
  color: string;
}

export const THEME_COLLECTIONS: readonly ThemeCollection[] = [
  {
    slug: "entrepreneur",
    title: "Entrepreneur",
    tagline: "Funded by dreams. Powered by caffeine.",
    blurb: "For founders, freelancers and startup survivors. Investor jokes, hustle culture and the pre-seed grind — printed.",
    keywords: ["startup", "entrepreneur", "investor", "investors", "founder", "funding", "hustle", "ceo", "seed"],
    featured: true,
    color: "#e76f51",
  },
  {
    slug: "office-unfiltered",
    title: "Office Unfiltered",
    tagline: "For the thoughts you have in meetings.",
    blurb: "Statement pieces for the 9-to-5 you survive daily. The things everyone thinks in the meeting, printed where everyone can read them.",
    keywords: ["office", "work", "boss", "meeting", "coworker", "monday", "friday", "deadline", "inbox", "hr department"],
    color: "#f58a73",
  },
  {
    slug: "gym-confessions",
    title: "Gym Confessions",
    tagline: "Sweat now, honesty included.",
    blurb: "For the 6am crew and the never-going-back crew alike. Say what the treadmill already knows about you.",
    keywords: ["gym", "workout", "fitness", "cardio", "protein", "leg day", "running", "lift"],
    color: "#b8ccad",
  },
  {
    slug: "family-roasts",
    title: "Family Roasts",
    tagline: "Love them. Roast them anyway.",
    blurb: "Gifts for the people who raised you and the people you married into. Affectionate, but make it a punchline.",
    keywords: ["mom", "dad", "mama", "papa", "family", "wife", "husband", "grandma", "grandpa", "mother", "father", "sister", "brother"],
    color: "#cfc2e7",
  },
  {
    slug: "brutally-honest",
    title: "Brutally Honest",
    tagline: "No filter. No regrets.",
    blurb: "For introverts, straight-talkers and everyone tired of small talk. Wear the sentence you'd never say out loud.",
    keywords: ["honest", "truth", "sarcasm", "sarcastic", "blunt", "introvert", "awkward", "antisocial"],
    color: "#f0b9a9",
  },
  {
    slug: "morning-truths",
    title: "Morning Truths",
    tagline: "Decaf is a lie. So is 'just one more snooze'.",
    blurb: "Mugs and morning pieces for people who don't do mornings. Strong opinions, stronger coffee.",
    keywords: ["coffee", "morning", "espresso", "latte", "caffeine", "decaf"],
    color: "#a9c8c0",
  },
  {
    slug: "pet-people",
    title: "Pet People",
    tagline: "My dog gets me. People, not so much.",
    blurb: "For the ones who'd rather be home with their animal. Loud love for the quietest family members.",
    keywords: ["dog", "cat", "pet", "puppy", "kitten", "paw", "paws"],
    color: "#e9c46a",
  },
  {
    slug: "spooky-season",
    title: "Spooky Season",
    tagline: "October energy, all year if you insist.",
    blurb: "Limited seasonal picks for Halloween and everyone who peaked in October. When they're gone, they're gone.",
    keywords: ["halloween", "spooky", "ghost", "witch", "pumpkin", "horror", "october", "vampire", "mummy"],
    seasonal: true,
    color: "#9b5de5",
  },
  {
    slug: "holiday-cheer",
    title: "Holiday Cheer",
    tagline: "Festive, with a side of honesty.",
    blurb: "Seasonal designs for the holidays — the family dinner edition. Gift the sentence everyone's thinking.",
    keywords: ["christmas", "xmas", "santa", "holiday", "merry", "noel", "december"],
    seasonal: true,
    color: "#2a9d8f",
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
    return collection.keywords.some((keyword) => keywordMatches(text, keyword));
  });
}

export function collectionBySlug(slug: string): ThemeCollection | undefined {
  return THEME_COLLECTIONS.find((collection) => collection.slug === slug);
}

/** Only collections that currently have products, everyday first, seasonal after. */
export function activeCollections(products: PrintifyProduct[]): Array<{ collection: ThemeCollection; products: PrintifyProduct[] }> {
  const active = THEME_COLLECTIONS.map((collection) => ({ collection, products: productsForCollection(products, collection) }))
    .filter((entry) => entry.products.length > 0);
  return [
    ...active.filter((entry) => !entry.collection.seasonal),
    ...active.filter((entry) => entry.collection.seasonal),
  ];
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
