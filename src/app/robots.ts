import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/admin/", "/api/", "/account", "/cart", "/checkout", "/login", "/register", "/forgot-password", "/auth/"];
  const aiAllow = ["/", "/products/", "/categories/", "/collections/", "/about", "/faq", "/shipping"];
  const aiBots = ["OAI-SearchBot", "GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "CCBot", "Meta-ExternalAgent", "Applebot-Extended"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      ...aiBots.map((userAgent) => ({ userAgent, allow: aiAllow, disallow: privatePaths })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
