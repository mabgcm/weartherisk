"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATEMENTS = [
  { line1: "THINK IT.", line2: "WEAR IT." },
  { line1: "SAY THE", line2: "QUIET PART." },
  { line1: "NO FILTER.", line2: "NO REGRETS." },
];

/**
 * Homepage hero: rotating statement copy on the left, visual panel on the
 * right. The panel stays empty for now — designed hero images come later.
 */
export function StatementHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % STATEMENTS.length), 6000);
    return () => clearInterval(timer);
  }, [paused]);

  const statement = STATEMENTS[index];

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
          <Link href="#collections" className="button button-dark">Collections </Link>
          <Link href="#new" className="text-link">New arrivals</Link>
        </div>
        <p className="hero-footnote">Designed in Canada. Shipped across Canada &amp; the US.</p>
      </div>
      <div className="statement-hero-visual" aria-hidden="true" />
    </section>
  );
}
