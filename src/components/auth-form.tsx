"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { emailActionSettings } from "@/lib/firebase/action-settings";

type Mode = "login" | "register" | "forgot";

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "forgot") {
        await sendPasswordResetEmail(firebaseAuth(), email, emailActionSettings("/login?reset=complete"));
        setMessage("Password reset email sent. Check your inbox and spam folder.");
      } else {
        if (mode === "register") await createUserWithEmailAndPassword(firebaseAuth(), email, password);
        else await signInWithEmailAndPassword(firebaseAuth(), email, password);
        router.replace(searchParams.get("next") || "/");
      }
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      setError(code.includes("invalid-credential") ? "Incorrect email or password." : code.includes("email-already-in-use") ? "An account already exists for this email." : code.includes("weak-password") ? "Use a password with at least 6 characters." : "We could not complete that request. Please try again.");
    } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password";
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-black/55">{mode === "forgot" ? "We’ll email you a secure reset link." : "Use your email and password to continue."}</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-black/15 px-4 py-3 font-normal outline-none focus:border-emerald-700" /></label>
          {mode !== "forgot" && <label className="block text-sm font-bold">Password<input required minLength={6} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-black/15 px-4 py-3 font-normal outline-none focus:border-emerald-700" /></label>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          <button disabled={busy} className="w-full cursor-pointer rounded-full bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email"}</button>
        </form>
        <div className="mt-6 flex justify-between gap-4 text-sm font-semibold">{mode === "login" && <><Link href="/forgot-password">Forgot password?</Link><Link href={`/register?next=${encodeURIComponent(searchParams.get("next") || "/")}`}>Create account</Link></>}{mode !== "login" && <Link href="/login">Back to sign in</Link>}</div>
      </div>
    </main>
  );
}
