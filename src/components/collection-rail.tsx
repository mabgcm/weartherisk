"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CardProduct } from "@/lib/catalog/card";
import type { ThemeCollection } from "@/lib/catalog/collections";

export function ProductCard({ product }: { product: CardProduct }) {
  return (
    <Link href={`/products/${product.id}`} className="risk-product-card">
      <div className="risk-product-image">
        {product.image && <Image src={product.image} alt={product.title} fill sizes="(min-width: 1100px) 25vw, (min-width: 650px) 33vw, 50vw" className="object-contain" />}
      </div>
      <h3>{product.title}</h3>
      <p>{product.price === null ? "See available options" : `From $${product.price.toFixed(2)}`}</p>
    </Link>
  );
}

interface CollectionRailProps {
  collection: ThemeCollection;
  products: CardProduct[];
}

/** One collection as a horizontal product strip: 4 visible, arrow buttons to scroll sideways. */
export function CollectionRail({ collection, products }: CollectionRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="collection-rail" aria-labelledby={`rail-${collection.slug}`}>
      <div className="rail-heading">
        <div>
          <p className="eyebrow">{collection.tagline}</p>
          <h2 id={`rail-${collection.slug}`}>{collection.title}</h2>
        </div>
        <div className="rail-actions">
          <Link href={`/collections/${collection.slug}`} className="text-link">
            View all <span aria-hidden="true">→</span>
          </Link>
          <button type="button" className="rail-btn" onClick={() => scroll(-1)} aria-label={`Scroll ${collection.title} products left`}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="rail-btn" onClick={() => scroll(1)} aria-label={`Scroll ${collection.title} products right`}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <div className="rail-track" ref={trackRef}>
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
