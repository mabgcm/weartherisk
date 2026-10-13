import Link from "next/link";
import Image from "next/image";
import darkLogo from "../../public/images/logo2.png";
import footerLogo from "../../public/images/logo3.png";
import { RegionalSettings } from "@/components/regional-settings";

interface SiteFooterProps {
  categories: Array<{ slug: string; title: string }>;
}

export function SiteFooter({ categories }: SiteFooterProps) {
  return <footer className="site-footer"><div className="footer-top"><div><Link href="/" className="footer-brand" aria-label="Wear The Risk home"><Image src={darkLogo} alt="Wear The Risk" sizes="120px" /></Link><p>Original pieces for original people.<br />Made to order in Canada.</p></div><div><p className="footer-label">Shop</p><Link href="/#shop">All products</Link>{categories.map((category) => <Link href={`/categories/${category.slug}`} key={category.slug}>{category.title}</Link>)}</div><div><p className="footer-label">Here to help</p><Link href="/faq">FAQ</Link><Link href="/shipping">Shipping & returns</Link><Link href="/track-order">Track your order</Link></div><div><p className="footer-label">About</p><Link href="/about">Our story</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div><Link href="/" className="footer-wordmark" aria-label="Wear The Risk home"><Image src={footerLogo} alt="Wear The Risk" sizes="(max-width: 650px) 90vw, 460px" /></Link><div className="footer-bottom"><p>© {new Date().getFullYear()} Wear The Risk. Made with feeling.</p><RegionalSettings /></div></footer>;
}
