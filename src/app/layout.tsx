import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getStorefrontCatalog } from "@/lib/catalog/storefront";
import { STORE_CATEGORIES } from "@/lib/catalog/categories";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl, safeJsonLd } from "@/lib/seo";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Original Statement Designs`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  keywords: ["original gifts Canada", "statement apparel", "graphic apparel", "art prints", "funny gifts Canada", "unique gifts"],
  authors: [{ name: SITE_NAME, url: SITE_URL }], creator: SITE_NAME, publisher: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      { url: "/images/fav.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/images/fav.png?v=3", type: "image/png", sizes: "512x512" }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "en_CA", url: SITE_URL, siteName: SITE_NAME, title: `${SITE_NAME} | Original Statement Designs`, description: DEFAULT_DESCRIPTION, images: [{ url: "/og-printstore.png?v=2", width: 1200, height: 630, alt: "Wear The Risk logo and statement apparel" }] },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} | Original Statement Designs`, description: DEFAULT_DESCRIPTION, images: ["/og-printstore.png?v=2"] },
  category: "shopping",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getStorefrontCatalog().catch(() => ({ products: [], categories: [...STORE_CATEGORIES] }));
  const populatedCategories = catalog.products.length ? catalog.categories
    .filter((category) => catalog.products.some((product) => category.blueprintIds.includes(product.blueprint_id) || category.fallbackMatcher.test(`${product.title} ${product.tags.join(" ")}`)))
    : catalog.categories;
  const categoryLinks = populatedCategories.map(({ slug, title }) => ({ slug, title }));

  const globalJsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "OnlineStore", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: absoluteUrl("/images/logo.png"), image: absoluteUrl("/images/logo.png"), description: DEFAULT_DESCRIPTION, email: "hello@canprintstore.com", areaServed: ["CA", "US"], currenciesAccepted: "CAD", hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: ["CA", "US"], returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted", merchantReturnLink: absoluteUrl("/shipping") } },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: "en-CA", publisher: { "@id": `${SITE_URL}/#organization` } },
  ] };
  return <html lang="en-CA" className={sans.variable}><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(globalJsonLd) }} /><Providers><SiteHeader categories={categoryLinks} /><div id="main-content" tabIndex={-1}>{children}</div><SiteFooter categories={categoryLinks} /></Providers></body><GoogleAnalytics gaId="G-VKSQX810RR" /></html>;
}
