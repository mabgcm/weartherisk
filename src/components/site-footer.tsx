import Link from "next/link";
import Image from "next/image";
import { RegionalSettings } from "@/components/regional-settings";

interface SiteFooterProps {
  categories: Array<{ slug: string; title: string }>;
}

export function SiteFooter({ categories }: SiteFooterProps) {
  return <footer className="site-footer"><div className="footer-top"><div><Link href="/" className="brand footer-brand"><span>Print</span><i>store</i><b>✦</b></Link><p>Original pieces for original people.<br />Made to order in Canada.</p></div><div><p className="footer-label">Shop</p><Link href="/#shop">All products</Link>{categories.map((category) => <Link href={`/categories/${category.slug}`} key={category.slug}>{category.title}</Link>)}</div><div><p className="footer-label">Here to help</p><Link href="/faq">FAQ</Link><Link href="/shipping">Shipping & returns</Link><Link href="/track-order">Track your order</Link></div><div><p className="footer-label">About</p><Link href="/about">Our story</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div><Link href="/" className="footer-wordmark" aria-label="Can Print Store home"><Image className="footer-logo-original" src="/images/logo.png" alt="Can Print Store" width={800} height={150} /><Image className="footer-logo-white-text" src="/images/logo.png" alt="" aria-hidden="true" width={800} height={150} /></Link><div className="footer-bottom"><p>© {new Date().getFullYear()} Can Print Store. Made with feeling.</p><RegionalSettings /></div></footer>;
}
