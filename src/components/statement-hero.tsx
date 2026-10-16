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

export function StatementHero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const statement = STATEMENTS[index % STATEMENTS.length];
  const slide = slides[index % Math.max(slides.length, 1)];

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
          more. Made to order, made to be noticed.
        </p>
        <div className="risk-hero-actions">
          <Link href="#moods" className="button button-dark">Shop by mood <span aria-hidden="true">↗</span></Link>
          <Link href="#new" className="text-link">New arrivals</Link>
        </div>
        <p className="hero-footnote">Made to order in Canada &amp; the US. Never mass-produced.</p>
      </div>
      <div className="statement-hero-visual">
        {slide ? (
          <Link href={`/products/${slide.id}`} className="hero-product-link" key={slide.id} aria-label={`Shop ${slide.title}`}>
            {slide.image && (
              <Image src={slide.image} alt={slide.title} fill sizes="(min-width: 900px) 50vw, 100vw" className="object-contain" priority />
            )}
            <span className="hero-product-caption"><span>{slide.title}</span><b aria-hidden="true">↗</b></span>
          </Link>
        ) : (
          <div className="hero-type-art" aria-label="Wear The Risk: made your way">
            <span className="hero-art-label">WEAR THE RISK / ORIGINAL DESIGN</span>
            <strong>BE<br />YOUR<br /><span>SELF.</span></strong>
            <span className="hero-art-bottom">No permission needed. <b aria-hidden="true">↗</b></span>
          </div>
        )}
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
      </div>
    </section>
  );
}
