import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Wear The Risk prints the things you think but never say out loud — original statement apparel, mugs and gifts, designed in Canada.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    n: "01",
    title: "Say it like you mean it.",
    body: "If a design doesn't make someone laugh, nod, or whisper “that's so true,” it doesn't make the cut.",
  },
  {
    n: "02",
    title: "Original or nothing.",
    body: "Every phrase starts as a blank page here. No stolen memes, no clip-art energy — just designs with a pulse.",
  },
  {
    n: "03",
    title: "Designed for you, not by committee.",
    body: "Every design starts in our studio — drawn for the sentence you think but never say. You don't customize anything; we've already done the thinking for you.",
  },
];

export default function AboutPage() {
  return <main className="about-page">
    <div className="about-wrap">
      <p className="eyebrow">Our story</p>
      <h1>Everyone thinks it.<br /><span>We print it.</span></h1>

      <div className="about-lede">
        <p>There&apos;s a sentence living in your head rent-free. The one you typed into the group chat and deleted. The one you rehearsed in the shower before a meeting. The one your face says when the in-laws visit.</p>
        <p><strong>Wear The Risk exists for that sentence.</strong></p>
      </div>

      <div className="about-body">
        <p>We design apparel, mugs, art prints and gifts around the things people actually think — the honest, funny, slightly unhinged stuff that never makes it past polite conversation. The quiet part, out loud, on something you can wear.</p>
        <p>No focus groups. No corporate-approved slogans. Just original designs, dropped seasonally, so there&apos;s always a new way to say what everyone&apos;s thinking.</p>
      </div>

      <section className="about-principles" aria-label="What we stand for">
        {PRINCIPLES.map((item) => (
          <article key={item.n}>
            <span aria-hidden="true">{item.n}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="about-how" aria-labelledby="how-title">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title">We design. You pick your sentence.</h2>
        <p>There&apos;s no customizer here, no blank canvas to fill — and that&apos;s the point. Every Wear The Risk piece starts as a finished design in our studio: the wording, the lettering, the placement, all obsessed over before it ever reaches the shop. You just find the one that sounds like you.</p>
        <p>Orders are produced and shipped through our specialist production partners across Canada and the US. We&apos;re the storefront, so if anything arrives less than perfect, you talk to us and we make it right.</p>
        <p className="about-fineprint">One honest note: product images are previews. Screens, fabrics and inks all have opinions about colour, so expect small differences between the mockup and the real thing. The attitude, though — that prints at full strength.</p>
        <p>Full details live in our <Link href="/shipping" className="text-link">shipping &amp; returns policy</Link>.</p>
      </section>

      <div className="about-cta">
        <h2>Got a sentence in mind?</h2>
        <div>
          <Link href="/#moods" className="button button-dark">Find your sentence <span aria-hidden="true">↗</span></Link>
          <Link href="/#shop" className="button button-outline">Browse everything</Link>
        </div>
      </div>
    </div>
  </main>;
}
