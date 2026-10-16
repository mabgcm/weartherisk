import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account-dashboard";

export const metadata: Metadata = { title: "My Account", description: "Manage your Wear The Risk profile and follow live Printify production, shipment and tracking details.", robots: { index: false, follow: false } };
export default function AccountPage() { return <AccountDashboard />; }
