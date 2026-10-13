import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about Can Print Store orders, production, shipping, tracking, returns, payments, product care and customer accounts.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  ["How are your products made?", "Every item is made to order after payment is confirmed. We work with Printify and its independent production partners; the provider used can vary by product, availability and delivery destination."],
  ["How long does production take?", "Production usually takes 2–5 business days, but this is an estimate rather than a guarantee. Complex products, quality checks, peak periods or provider capacity can require additional time."],
  ["Where do you ship?", "Checkout currently accepts delivery addresses in Canada and the United States. Available delivery services and the final shipping charge are shown before payment."],
  ["How much is shipping?", "Standard shipping is free when the merchandise subtotal is CAD $75 or more. For smaller orders, standard shipping is CAD $7.99. Applicable taxes are calculated separately at checkout."],
  ["When will my order arrive?", "After production, standard delivery is estimated at 5–10 business days. The estimate shown at checkout is not a guaranteed delivery date and can be affected by the destination, carrier, customs, weather or peak demand."],
  ["How do I track my order?", "Sign in to view order progress in your account. When the production partner provides tracking, it will appear with the order details. You can also use the Track order link in the footer."],
  ["Can products in one order arrive separately?", "Yes. Products may be made by different production partners and can be dispatched in separate packages. Separate tracking numbers may be provided without an additional shipping charge."],
  ["Can I change or cancel an order?", "Contact support immediately at hello@canprintstore.com. Because paid orders can enter production quickly, changes and cancellations are not guaranteed once production has started."],
  ["Can I return or exchange the size or colour I ordered?", "Because each product is made specifically for the order, we do not accept change-of-mind returns or exchanges for a customer-selected size, colour or design, except where required by applicable law. Review the product details and size information before ordering."],
  ["What if my item is damaged, defective or incorrect?", "Email hello@canprintstore.com within 30 days after delivery. Include the order number, a description of the issue and clear photographs of the item and packaging. After review, an eligible claim will receive a replacement or refund at no additional cost; you generally will not need to return a damaged item."],
  ["What if my package is delayed or marked delivered?", "First check the tracking link, delivery address, safe-drop areas and your local carrier. If it still cannot be located, email hello@canprintstore.com with your order number so we can investigate with the production and delivery partners."],
  ["What currency will I be charged in?", "The storefront's base prices are Canadian dollars (CAD). Where Stripe Adaptive Pricing supports the customer's location and payment method, secure checkout presents and charges an automatically converted local-currency total. Otherwise the charge remains in CAD, and the card issuer may apply its own conversion or international transaction fee."],
  ["How are payments and taxes handled?", "Payments are processed securely by Stripe. Can Print Store does not receive your complete card number. Applicable sales taxes are calculated at checkout using the shipping and billing information provided."],
  ["Do I need an account to order?", "Yes. An account lets us securely associate your delivery information, order history and live order status with you."],
  ["How do I reset my password?", "Select Forgot password on the login page. Firebase Authentication will send a secure reset link to the email address registered to your account."],
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl("/faq")}#faq`,
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return <main className="mx-auto min-h-[65vh] max-w-3xl px-6 py-20">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Help centre</p>
    <h1 className="mt-4 text-5xl font-black tracking-tight">Frequently asked questions</h1>
    <p className="mt-5 max-w-2xl leading-7 text-black/60">Clear answers about ordering made-to-order products from Can Print Store. For full policy details, read our <Link className="font-bold text-emerald-800 underline" href="/shipping">Shipping &amp; returns policy</Link>.</p>
    <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
      {faqs.map(([question, answer]) => <details key={question} className="group py-6"><summary className="cursor-pointer list-none font-bold">{question}<span className="float-right" aria-hidden="true">+</span></summary><p className="mt-4 leading-7 text-black/60">{answer}</p></details>)}
    </div>
  </main>;
}
