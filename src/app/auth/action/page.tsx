import type { Metadata } from "next";
import { Suspense } from "react";
import { FirebaseActionHandler } from "@/components/firebase-action-handler";

export const metadata: Metadata = { title: "Account Security", robots: { index: false, follow: false } };
export default function FirebaseActionPage() { return <Suspense fallback={<main className="auth-action-page"><div>Checking your secure link…</div></main>}><FirebaseActionHandler /></Suspense>; }
