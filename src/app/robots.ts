import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/admin/", "/api/", "/account", "/cart", "/checkout", "/login", "/register", "/forgot-password", "/auth/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: "OAI-SearchBot", allow: ["/", "/products/", "/categories/", "/about", "/faq", "/shipping"], disallow: privatePaths },
      { userAgent: "GPTBot", allow: ["/", "/products/", "/categories/", "/about", "/faq", "/shipping"], disallow: privatePaths },
      { userAgent: "ClaudeBot", allow: ["/", "/products/", "/categories/", "/about", "/faq", "/shipping"], disallow: privatePaths },
      { userAgent: "PerplexityBot", allow: ["/", "/products/", "/categories/", "/about", "/faq", "/shipping"], disallow: privatePaths },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
