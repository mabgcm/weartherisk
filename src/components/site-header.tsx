"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "../../public/images/logo.png";
import { useEffect, useRef, useState } from "react";
import { useAuth, useCart } from "@/components/providers";
import { AnnouncementTicker } from "@/components/announcement-ticker";

const COLLECTION_LINKS = [
  { slug: "halloween", title: "Halloween" },
  { slug: "christmas", title: "Christmas" },
  { slug: "entrepreneur", title: "Entrepreneur" },
  { slug: "wow", title: "WoW" },
  { slug: "league-of-legends", title: "LoL" },
];

const PRODUCT_LINKS = [
  { title: "Apparel", href: "/shop?type=Apparel" },
  { title: "Caps", href: "/shop?type=Caps" },
  { title: "Trucker hats", href: "/shop?type=Trucker%20hats" },
  { title: "Mugs", href: "/shop?type=Mugs" },
  { title: "Tumblers", href: "/shop?type=Tumblers" },
  { title: "Bags", href: "/shop?type=Bags" },
  { title: "Phone cases", href: "/shop?type=Phone%20cases" },
  { title: "Stickers & decals", href: "/shop?type=Stickers%20%26%20decals" },
  { title: "Car magnets", href: "/shop?type=Car%20magnets" },
  { title: "Accessories", href: "/shop?type=Accessories" },
];

const GIFT_LINKS = [
  { slug: "christmas-gifts", title: "Christmas Gifts" },
  { slug: "gifts-for-wow-gamers", title: "Gifts for WoW Gamers" },
  { slug: "gifts-for-lol-gamers", title: "Gifts for LoL Gamers" },
];

interface SiteHeaderProps {
  categories: Array<{ slug: string; title: string }>;
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    menu?.querySelector<HTMLButtonElement>("button")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Tab" && menu) {
        const controls = Array.from(menu.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <AnnouncementTicker />
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-logo" aria-label="Wear The Risk home"><Image src={logo} alt="Wear The Risk" sizes="130px" preload /></Link>
        <nav className="desktop-nav" aria-label="Shop navigation"><div className="nav-dropdown"><Link href="/#collections" className="nav-dropdown-toggle" aria-haspopup="true">Collections</Link><div className="nav-dropdown-menu">{COLLECTION_LINKS.map((link) => <Link key={link.slug} href={`/collections/${link.slug}`}>{link.title}</Link>)}</div></div><div className="nav-dropdown"><Link href="/shop" className="nav-dropdown-toggle" aria-haspopup="true">Products</Link><div className="nav-dropdown-menu"><Link href="/shop">All Products</Link>{PRODUCT_LINKS.map((link) => <Link key={link.title} href={link.href}>{link.title}</Link>)}</div></div><div className="nav-dropdown"><Link href="/#gifts" className="nav-dropdown-toggle" aria-haspopup="true">Gifts</Link><div className="nav-dropdown-menu">{GIFT_LINKS.map((link) => <Link key={link.slug} href={`/collections/${link.slug}`}>{link.title}</Link>)}</div></div><Link href="/about">Our story</Link></nav>
        <nav className="utility-nav" aria-label="Account navigation">
          <form className="header-search" role="search" action="/search" method="get">
            <label className="sr-only" htmlFor="header-search">Search products</label>
            <input id="header-search" name="q" type="search" placeholder="Search designs…" autoComplete="off" />
            <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></button>
          </form>
          {!loading && <div className="header-auth-links">
            {user
              ? <Link href="/account" aria-label="Open your account">Account</Link>
              : <Link href="/login">Login</Link>}
          </div>}
          <Link href="/cart" className="cart-link" aria-label={`Shopping bag with ${count} items`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 8.25h10.5l.75 12H6l.75-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            <span>{count}</span>
          </Link>
          <button ref={triggerRef} className="menu-trigger" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
        </nav>
      </div>
    </header>
    {menuOpen && <div className="menu-overlay" onMouseDown={closeMenu} role="presentation">
      <aside ref={menuRef} id="site-menu" className="menu-drawer" role="dialog" aria-modal="true" aria-label="Site menu" onMouseDown={(event) => event.stopPropagation()}>
        <header><Link href="/" className="brand-logo" onClick={closeMenu}><Image src={logo} alt="Wear The Risk" sizes="150px" /></Link><button type="button" onClick={closeMenu} aria-label="Close menu">×</button></header>
        <form className="drawer-search" role="search" action="/search" method="get">
          <label className="sr-only" htmlFor="drawer-search">Search products</label>
          <input id="drawer-search" name="q" type="search" placeholder="Search designs…" autoComplete="off" />
          <button type="submit">Search</button>
        </form>
        <nav aria-label="Main navigation">
          <Link href="/shop" onClick={closeMenu}>Shop all </Link>
          <Link href="/#collections" onClick={closeMenu}>Collections </Link>
          {COLLECTION_LINKS.map((link) => <Link href={`/collections/${link.slug}`} key={link.slug} onClick={closeMenu}>{link.title}<span>→</span></Link>)}
          {PRODUCT_LINKS.map((link) => <Link href={link.href} key={link.title} onClick={closeMenu}>{link.title}<span>→</span></Link>)}
          {GIFT_LINKS.map((link) => <Link href={`/collections/${link.slug}`} key={link.slug} onClick={closeMenu}>{link.title}<span>→</span></Link>)}
          {categories.map((category) => <Link href={`/categories/${category.slug}`} key={category.slug} onClick={closeMenu}>{category.title}<span>→</span></Link>)}
          <Link href="/about" onClick={closeMenu}>Our story <span>→</span></Link>
        </nav>
        <nav className="menu-secondary" aria-label="Customer links">
          {user
            ? <Link href="/account" onClick={closeMenu}>Your account</Link>
            : <Link href="/login" onClick={closeMenu}>Login</Link>}
          <Link href="/track-order" onClick={closeMenu}>Track an order</Link>
          <Link href="/faq" onClick={closeMenu}>FAQ</Link>
          <Link href="/cart" onClick={closeMenu}>Your bag ({count})</Link>
        </nav>
      </aside>
    </div>}
  </>;
}
