"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface FeaturedSlide {
  id: string;
  title: string;
  image?: string;
}

interface FeaturedSpotlightProps {
  slug: string;
  title: string;
  blurb: string;
  slides: FeaturedSlide[];
}

/** Featured collection spotlight with auto-rotating product slides. */
export function FeaturedSpotlight({ slug, title, blurb, slides }: FeaturedSpotlightProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[index % Math.max(slides.length, 1)];

  return (
    <section
      className="seasonal-spotlight featured-spotlight"
      aria-labelledby="featured-collection"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="seasonal-copy">
        <p className="eyebrow">Founder favorites</p>
        <h2 id="featured-collection">{title}</h2>
        <p>{blurb}</p>
        <Link href={`/collections/${slug}`} className="button button-dark">
          Shop the collection <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="seasonal-art">
        {slide && (
          <Link
            href={`/products/${slide.id}`}
            key={slide.id}
            className="hero-product-link statement-rotate"
            aria-label={`Shop ${slide.title}`}
          >
            {slide.image && (
              <Image src={slide.image} alt={slide.title} fill sizes="(min-width: 900px) 50vw, 100vw" className="object-contain" />
            )}
            <span className="hero-product-caption"><span>{slide.title}</span><b aria-hidden="true">↗</b></span>
          </Link>
        )}
        {slides.length > 1 && (
          <div className="hero-dots" role="tablist" aria-label="Featured collection products">
            {slides.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={dot === index % slides.length}
                aria-label={`Show ${item.title}`}
                className={dot === index % slides.length ? "active" : ""}
                onClick={() => setIndex(dot)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
