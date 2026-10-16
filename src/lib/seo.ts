export const SITE_NAME = "Wear The Risk";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://weartherisk.com").replace(/\/$/, "");
export const DEFAULT_DESCRIPTION = "Shop original statement gifts, apparel, mugs, art prints, accessories and home décor from Wear The Risk.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", copy: "©", reg: "®" };

export function plainText(value: string) {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#")) {
        const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : " ";
      }
      return ENTITIES[code.toLowerCase()] ?? entity;
    }).replace(/\s+/g, " ").trim();
}

export function metaDescription(value: string, fallback = DEFAULT_DESCRIPTION) {
  const text = plainText(value) || fallback;
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "").trimEnd()}…`;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
