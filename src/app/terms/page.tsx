import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of Can Print Store, customer accounts, made-to-order purchases, payments, shipping, returns and product content.",
  alternates: { canonical: "/terms" },
};

const sections = [
  ["Agreement", "These Terms govern your use of canprintstore.com and purchases from Can Print Store. By creating an account, submitting an order or using the storefront, you agree to these Terms and the policies linked from them. If you do not agree, do not use the service or place an order."],
  ["Eligibility and accounts", "You must be legally able to enter a purchase contract in your jurisdiction. Provide accurate, current information and keep your login credentials confidential. You are responsible for activity performed through your account and must notify us promptly of suspected unauthorized access."],
  ["Products and previews", "Products are made to order through independent production partners. We make reasonable efforts to present descriptions, variants and mock-up images accurately, but screen settings, materials and print processes can cause reasonable differences in colour, texture, scale or placement. Availability and specifications can change without notice."],
  ["Prices, taxes and payment", "Storefront base prices are displayed in Canadian dollars unless stated otherwise. Where supported, Stripe Adaptive Pricing can present and charge the checkout total in the customer's local currency; its displayed conversion is the applicable transaction price. Shipping and applicable taxes are shown before payment. Payments are subject to authorization and fraud screening. An order is not accepted until payment is confirmed and we send or display an order confirmation."],
  ["Order review and cancellation", "We may reject or cancel an order for suspected fraud, pricing or catalogue errors, unavailable products, invalid delivery information, legal restrictions or inability to fulfil it. If we cancel a paid order, we will refund the affected amount. Customer-requested changes or cancellations are not guaranteed after production begins."],
  ["Production, shipping and returns", "Production and delivery dates are estimates, not guarantees. Title and risk of loss pass as provided by applicable law and carrier terms. Our current delivery areas, rates, damaged-item process, replacement terms and return limitations form part of these Terms and are described in the Shipping & returns policy."],
  ["Customer content and reviews", "You retain ownership of text or photographs you submit. You grant Can Print Store a non-exclusive, worldwide, royalty-free licence to host, reproduce and display submitted reviews and related content for operating and promoting the storefront. Do not submit unlawful, infringing, deceptive, abusive or private information. We may moderate or remove content that violates these Terms."],
  ["Intellectual property", "The storefront design, branding, product artwork, text and other content are owned by Can Print Store or used under licence and are protected by applicable intellectual-property laws. You may use the site for personal shopping only. You may not copy, sell, scrape, reverse engineer or commercially exploit its content without permission."],
  ["Acceptable use", "Do not interfere with the service, attempt unauthorized access, upload malicious code, misuse another person’s account, make fraudulent purchases, automate abusive requests, or use the storefront in a way that violates law or another person’s rights."],
  ["Third-party services", "The storefront relies on services including Firebase, Stripe, Printify, production partners, carriers, Vercel and Google Analytics. Their own terms and privacy practices may apply when they process information or provide a service. We are not responsible for an independent service outside our reasonable control, but this does not remove responsibilities that applicable consumer law places on Can Print Store."],
  ["Disclaimers and liability", "To the extent permitted by law, the storefront is provided on an “as available” basis and we do not promise uninterrupted or error-free access. Can Print Store is not liable for indirect, incidental or consequential loss that was not reasonably foreseeable. Nothing in these Terms excludes liability or a warranty, remedy or consumer right that cannot legally be excluded or limited."],
  ["Indemnity", "To the extent permitted by law, you agree to be responsible for losses or claims caused by your unlawful misuse of the storefront, violation of these Terms or infringement of another person’s rights."],
  ["Changes, severability and governing law", "We may update these Terms prospectively by posting a revised version and date. The Terms in effect when an order is accepted continue to govern that purchase. If one provision is unenforceable, the remaining provisions continue to apply. These Terms are governed by the laws that apply to Can Print Store and your purchase, without limiting mandatory consumer protections available in your province, state or country."],
  ["Support", "Questions about an order or these Terms can be sent to hello@canprintstore.com. Include the relevant order number, but never send complete payment-card information by email."],
];

export default function TermsPage() {
  return <main className="mx-auto min-h-[65vh] max-w-3xl px-6 py-20">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Store agreement</p>
    <h1 className="mt-4 text-5xl font-black tracking-tight">Terms of service</h1>
    <p className="mt-5 leading-7 text-black/60">Last updated: August 15, 2026</p>
    <p className="mt-6 leading-7 text-black/60">Please also read our <Link href="/shipping" className="font-bold text-emerald-800 underline">Shipping &amp; returns policy</Link> and <Link href="/privacy" className="font-bold text-emerald-800 underline">Privacy policy</Link>.</p>
    <div className="mt-10 space-y-9 leading-7 text-black/60">
      {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-black text-black">{title}</h2><p className="mt-2">{text}</p></section>)}
    </div>
  </main>;
}
