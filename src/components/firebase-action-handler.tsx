"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

type View = "checking" | "reset" | "verify" | "success" | "invalid";

export function FirebaseActionHandler() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const continueUrl = params.get("continueUrl");
  const [view, setView] = useState<View>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const task = window.setTimeout(() => {
      if (!code) { setView("invalid"); return; }
      if (mode === "resetPassword") {
        void verifyPasswordResetCode(firebaseAuth(), code).then((accountEmail) => { setEmail(accountEmail); setView("reset"); }).catch(() => setView("invalid"));
      } else if (mode === "verifyEmail") setView("verify");
      else setView("invalid");
    }, 0);
    return () => window.clearTimeout(task);
  }, [code, mode]);

  async function resetPassword(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) { setError("Use at least 8 characters with a letter and a number."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try { await confirmPasswordReset(firebaseAuth(), code, password); setView("success"); }
    catch { setError("This link is no longer valid. Request a new password reset email."); }
    finally { setBusy(false); }
  }

  async function verifyEmail() {
    setBusy(true); setError("");
    try { await applyActionCode(firebaseAuth(), code); setView("success"); }
    catch { setView("invalid"); }
    finally { setBusy(false); }
  }

  const safeContinueUrl = continueUrl && (() => { try { const parsed = new URL(continueUrl); return parsed.pathname + parsed.search; } catch { return "/login"; } })();
  return <main className="auth-action-page"><section>
    <Link href="/" className="brand"><span>Print</span><i>store</i><b>✦</b></Link>
    {view === "checking" && <div className="action-state"><span>◎</span><h1>Checking your secure link…</h1><p>This should only take a moment.</p></div>}
    {view === "reset" && <><p className="eyebrow"><span /> Account security</p><h1>Choose a new password</h1><p className="action-copy">Resetting the password for <strong>{email}</strong>.</p><form onSubmit={resetPassword}><label>New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label><small>At least 8 characters, including a letter and a number.</small><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required /></label>{error && <p className="action-error" role="alert">{error}</p>}<button disabled={busy}>{busy ? "Updating…" : "Update password"}</button></form></>}
    {view === "verify" && <div className="action-state"><span>✉</span><h1>Verify your email</h1><p>Confirm that this email address belongs to you.</p>{error && <p className="action-error">{error}</p>}<button disabled={busy} onClick={() => void verifyEmail()}>{busy ? "Verifying…" : "Verify email"}</button></div>}
    {view === "success" && <div className="action-state"><span>✓</span><h1>{mode === "resetPassword" ? "Password updated" : "Email verified"}</h1><p>{mode === "resetPassword" ? "You can now sign in with your new password." : "Your account email has been verified."}</p><Link href={safeContinueUrl || "/login"} className="button button-dark">Continue</Link></div>}
    {view === "invalid" && <div className="action-state"><span>!</span><h1>This link isn&apos;t valid</h1><p>It may have expired, already been used, or been copied incorrectly.</p><Link href="/forgot-password" className="button button-dark">Request a new link</Link></div>}
  </section></main>;
}
