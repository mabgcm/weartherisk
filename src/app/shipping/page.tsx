import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping, Production and Returns",
  description: "Can Print Store production times, delivery estimates, shipping rates, tracking, damaged-item claims, replacements and refunds.",
  alternates: { canonical: "/shipping" },
};

const sections = [
  ["Made-to-order production", "Products are created only after an order is paid. Production normally takes 2–5 business days. This is an estimate: product complexity, quality checks, production capacity and peak periods can extend the dispatch time."],
  ["Delivery areas and rates", "We currently ship to addresses in Canada and the United States. Standard shipping is free for merchandise subtotals of CAD $75 or more; otherwise it is CAD $7.99. Taxes are calculated separately at checkout. The available service and final total are displayed before payment."],
  ["Delivery estimates", "Standard delivery after production is estimated at 5–10 business days. Checkout and tracking dates are estimates, not guarantees. Carrier delays, weather, customs, remote destinations and seasonal volume are outside our direct control."],
  ["Tracking and split shipments", "Tracking is displayed in your account when supplied by the production partner. Products may be made at different facilities and shipped separately, so one order can have multiple packages and tracking numbers."],
  ["Address accuracy", "Check the name, street address, unit number, postal or ZIP code and phone number before paying. Contact hello@canprintstore.com immediately if something is wrong. We cannot guarantee an address change after production begins, and replacement or reshipping costs caused by an incomplete or incorrect address may be the customer's responsibility."],
  ["Changes and cancellations", "Because production can begin shortly after payment, changes and cancellations are not guaranteed. Send the request immediately to hello@canprintstore.com with the order number. If production has not started, we will make a reasonable effort to help."],
  ["Change-of-mind returns", "Each item is produced for a specific order. We therefore do not accept returns or exchanges because of a change of mind, an incorrectly selected size or colour, or a preference for another design, except where applicable consumer law requires otherwise."],
  ["Damaged, defective or incorrect items", "Report the problem to hello@canprintstore.com within 30 days after delivery. Include the order number, a clear description, and photographs showing the item, defect and packaging. If multiple items are affected, we may request one image showing them together. Eligible claims receive a replacement or refund at no additional cost. A damaged item generally does not need to be returned."],
  ["Lost or delayed packages", "Check the carrier tracking, delivery address, safe-drop areas, neighbours and local post office first. If the package remains missing, email us with the order number. We will investigate with the production partner and carrier; the available resolution depends on the tracking result and whether the submitted address was complete and correct."],
  ["Refunds", "Approved refunds are sent to the original payment method. Shipping charges are refunded when the entire order qualifies or where required by law. Bank and card processing times vary, so the credit may take several business days to appear after it is issued."],
];

export default function ShippingPage() {
  return <main className="mx-auto min-h-[65vh] max-w-3xl px-6 py-20">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Order policy</p>
    <h1 className="mt-4 text-5xl font-black tracking-tight">Shipping &amp; returns</h1>
    <p className="mt-5 leading-7 text-black/60">Last updated: August 15, 2026</p>
    <div className="mt-10 space-y-9 leading-7 text-black/60">
      {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-black text-black">{title}</h2><p className="mt-2">{text}</p></section>)}
    </div>
  </main>;
}
