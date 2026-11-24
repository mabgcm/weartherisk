"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface HeroSlide {
  id: string;
  title: string;
  image?: string;
}

const STATEMENTS = [
  { line1: "THINK IT.", line2: "WEAR IT." },
  { line1: "SAY THE", line2: "QUIET PART." },
  { line1: "NO FILTER.", line2: "NO REGRETS." },
];

/**
 * Homepage hero: rotating statement copy on the left, seasonal product
 * photography on the right (Christmas model shots). Falls back to an empty
 * panel when no slides are supplied.
 */
export function StatementHero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const cycle = Math.max(slides.length, STATEMENTS.length);

  useEffect(() => {
    if (paused || cycle < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % cycle), 6000);
    return () => clearInterval(timer);
  }, [paused, cycle]);

  const statement = STATEMENTS[index % STATEMENTS.length];
  const slide = slides.length ? slides[index % slides.length] : undefined;

  return (
    <section
      className="statement-hero"
      aria-labelledby="hero-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="statement-hero-copy">
        <p className="eyebrow">Wear The Risk — original statement pieces</p>
        <h1 id="hero-title" key={index} className="statement-rotate">
          {statement.line1}
          <br />
          <span>{statement.line2}</span>
        </h1>
        <p className="risk-hero-description">
          The things you think but never say out loud — printed on apparel, mugs and
          more. Designed to be noticed.
        </p>
        <div className="risk-hero-actions">
          <Link href="#collections" className="button button-dark">Collections</Link>
          <Link href="#new" className="text-link">New arrivals</Link>
        </div>
        <p className="hero-footnote">Designed in Canada. Shipped across Canada &amp; the US.</p>
      </div>
      <div className="statement-hero-visual">
        {slide?.image ? (
          <>
            <Link href={`/products/${slide.id}`} className="hero-product-link" key={slide.id} aria-label={`Shop ${slide.title}`}>
              <Image src={slide.image} alt={slide.title} fill sizes="(min-width: 900px) 50vw, 100vw" className="object-cover" priority />
              <span className="hero-product-caption"><span>{slide.title}</span></span>
            </Link>
            {slides.length > 1 && (
              <div className="hero-dots" role="tablist" aria-label="Featured products">
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
          </>
        ) : null}
      </div>
    </section>
  );
}
