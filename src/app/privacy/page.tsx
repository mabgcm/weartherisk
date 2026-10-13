import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Can Print Store collects, uses, shares, protects and retains account, order, payment and website analytics information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  ["Who this policy covers", "This policy explains how Can Print Store handles personal information when you browse canprintstore.com, create an account, place an order, submit a product review or request support."],
  ["Information you provide", "We may collect your name, email address, telephone number, account identifier, billing and shipping details entered at secure checkout, order contents, product selections, support messages, photographs supplied with a product claim and reviews you choose to publish."],
  ["Payments", "Payments are processed by Stripe. Stripe receives the payment, billing and transaction information required to complete the purchase, prevent fraud and calculate applicable taxes. Can Print Store receives transaction references, payment status and order totals, but does not receive or store your complete payment-card number."],
  ["Information collected automatically", "Our hosting and security systems may process IP address, browser and device information, requested pages, timestamps, referring pages and diagnostic logs. Google Analytics 4 uses cookies or similar identifiers to measure visits, page interactions, device information and approximate location. This helps us understand and improve the storefront."],
  ["How we use information", "We use personal information to authenticate accounts; save customer preferences; validate, process and deliver orders; calculate shipping and taxes; provide order history and tracking; prevent fraud and abuse; publish and moderate reviews; respond to support and product claims; improve site reliability; comply with legal, tax and accounting obligations; and enforce our terms."],
  ["Service providers and disclosures", "We disclose only the information reasonably needed for services to operate: Google Firebase for authentication and customer/order data; Stripe for checkout, payment, tax and fraud prevention; Printify and its production and delivery partners for manufacture, fulfilment and shipping; Vercel for website hosting and operational logs; and Google Analytics for aggregated site measurement. We may also disclose information where required by law, to protect users and the service, or as part of a business transfer subject to appropriate safeguards."],
  ["International processing", "Our providers and their subprocessors may store or process information outside your province or country, including the United States. Information processed elsewhere can be subject to the laws and lawful access requirements of that jurisdiction."],
  ["Retention", "We keep personal information only as long as reasonably necessary for the purposes described here, including order support, fraud prevention and legal, tax or accounting requirements. Retention periods vary by record type. Data is deleted or de-identified when it is no longer required, subject to backups and legal obligations."],
  ["Your choices and rights", "Depending on applicable law, you may ask to access or correct personal information we hold, withdraw consent where processing depends on consent, or request deletion. Some records may need to be retained to complete an order, protect the service or meet legal obligations. You can control cookies through your browser and use Google’s available analytics opt-out controls."],
  ["Security", "We use reasonable administrative and technical safeguards and rely on established providers for authentication and payment processing. No online system or transmission method can be guaranteed completely secure. Protect your password and notify us if you believe your account has been misused."],
  ["Children", "The storefront is intended for people able to enter a purchase contract in their jurisdiction and is not directed to children. We do not knowingly seek personal information from children without the authorization required by applicable law."],
  ["Updates and privacy requests", "We may update this policy as the store, providers or legal requirements change. The revised date will appear on this page. For access, correction, deletion or privacy questions, email hello@canprintstore.com and use the subject line “Privacy request”. We may need to verify your identity before acting on a request."],
];

export default function PrivacyPage() {
  return <main className="mx-auto min-h-[65vh] max-w-3xl px-6 py-20">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Your information</p>
    <h1 className="mt-4 text-5xl font-black tracking-tight">Privacy policy</h1>
    <p className="mt-5 leading-7 text-black/60">Last updated: August 15, 2026</p>
    <div className="mt-10 space-y-9 leading-7 text-black/60">
      {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-black text-black">{title}</h2><p className="mt-2">{text}</p></section>)}
    </div>
  </main>;
}
