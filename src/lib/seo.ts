export const SITE_NAME = "Can Print Store";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.canprintstore.com").replace(/\/$/, "");
export const DEFAULT_DESCRIPTION = "Shop original made-to-order gifts, apparel, mugs, art prints, accessories and home décor from Can Print Store in Canada.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

export function metaDescription(value: string, fallback = DEFAULT_DESCRIPTION) {
  const text = plainText(value) || fallback;
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}…`;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
