"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth, useCart } from "@/components/providers";

interface SiteHeaderProps {
  categories: Array<{ slug: string; title: string }>;
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return <>
    <div className="announcement"><p>Free shipping on orders $75+ <span>•</span> Made to order, worth the wait</p></div>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-logo" aria-label="Can Print Store home"><Image src="/images/logo.png" alt="Can Print Store" width={800} height={150} priority /></Link>
        <nav className="utility-nav" aria-label="Account navigation">
          {!loading && <div className="header-auth-links">
            {user
              ? <Link href="/account" aria-label="Open your account">Account</Link>
              : <Link href="/login">Login</Link>}
          </div>}
          <Link href="/cart" className="cart-link" aria-label={`Shopping bag with ${count} items`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 8.25h10.5l.75 12H6l.75-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            <span>{count}</span>
          </Link>
          <button className="menu-trigger" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
        </nav>
      </div>
    </header>
    {menuOpen && <div className="menu-overlay" onMouseDown={closeMenu} role="presentation">
      <aside id="site-menu" className="menu-drawer" role="dialog" aria-modal="true" aria-label="Site menu" onMouseDown={(event) => event.stopPropagation()}>
        <header><Link href="/" className="brand-logo" onClick={closeMenu}><Image src="/images/logo.png" alt="Can Print Store" width={800} height={150} /></Link><button type="button" onClick={closeMenu} aria-label="Close menu">×</button></header>
        <nav aria-label="Main navigation">
          <Link href="/#shop" onClick={closeMenu}>Shop all <span>↗</span></Link>
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
