import type { Metadata } from "next";
import { OrderTracker } from "@/components/order-tracker";

export const metadata: Metadata = { title: "Track Your Order", description: "See the current production and shipping status of your Printstore order.", robots: { index: false, follow: false } };

export default function TrackOrderPage() {
  return <main className="track-page"><header><p className="eyebrow"><span /> Live order updates</p><h1>Track your order</h1><p>From production to your doorstep, see where your Printstore order is now.</p></header><OrderTracker /></main>;
}
