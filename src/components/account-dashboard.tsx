"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { sendEmailVerification, sendPasswordResetEmail, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { emailActionSettings } from "@/lib/firebase/action-settings";
import { customerErrorMessage, getCustomerProfile, saveCustomerProfile, type CustomerProfile } from "@/lib/firebase/customer";
import { useAuth } from "@/components/providers";
import { OrderTracker } from "@/components/order-tracker";

const blankProfile = (email = ""): CustomerProfile => ({ displayName: "", phone: "", email, marketingConsent: false, addresses: [] });

export function AccountDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile>(blankProfile());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState<"profile" | "orders" | "security">("profile");

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getCustomerProfile(user.uid, user.email ?? "").then((data) => { if (active) setProfile(data); }).catch(() => { if (active) setProfile(blankProfile(user.email ?? "")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); if (!user) return; setBusy(true); setNotice("");
    try { await saveCustomerProfile(user.uid, profile); setNotice("Your profile has been saved."); }
    catch (reason) { console.error("[account] profile save failed", reason); setNotice(customerErrorMessage(reason)); }
    finally { setBusy(false); }
  }
  if (authLoading) return <main className="account-page"><div className="account-loading">Loading your account…</div></main>;
  if (!user) return <main className="account-page"><div className="account-gate"><span>◎</span><h1>Your account, all together.</h1><p>Sign in to manage your profile and track live production and delivery details.</p><Link href="/login?next=/account" className="button button-dark">Sign in</Link></div></main>;
  if (loading) return <main className="account-page"><div className="account-loading">Loading your account…</div></main>;

  return <main className="account-page"><header className="account-hero"><div><p className="eyebrow"><span /> Customer account</p><h1>Welcome{profile.displayName ? `, ${profile.displayName.split(" ")[0]}` : " back"}.</h1><p>{user.email}</p></div><button onClick={() => signOut(firebaseAuth())}>Sign out</button></header>
    <div className="account-layout"><nav className="account-nav" aria-label="Account sections">{([['profile','Profile'],['orders','Orders'],['security','Security']] as const).map(([id,label]) => <button className={section === id ? "active" : ""} onClick={() => setSection(id)} key={id}>{label}<span>→</span></button>)}</nav>
      <section className="account-content">{notice && <p className="account-notice" role="status">{notice}</p>}
        {section === "profile" && <form onSubmit={saveProfile} className="account-card"><div className="account-card-head"><div><small>Personal details</small><h2>Your profile</h2></div><span>Member since {new Intl.DateTimeFormat("en-CA", { month: "short", year: "numeric" }).format(user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date())}</span></div><div className="account-fields"><Field label="Full name" value={profile.displayName} onChange={(value) => setProfile({ ...profile, displayName: value })} autoComplete="name" /><Field label="Phone" type="tel" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} autoComplete="tel" /><Field label="Email" type="email" value={profile.email} disabled onChange={() => undefined} autoComplete="email" /></div><label className="account-check"><input type="checkbox" checked={profile.marketingConsent} onChange={(event) => setProfile({ ...profile, marketingConsent: event.target.checked })} /><span><strong>Studio notes</strong><small>Receive new collection news and occasional offers. You can opt out anytime.</small></span></label><button disabled={busy} className="account-save">{busy ? "Saving…" : "Save profile"}</button></form>}
        {section === "orders" && <div className="account-orders"><div className="account-card-head"><div><small>Purchase history</small><h2>Your orders</h2></div><Link href="/track-order">Open full tracker ↗</Link></div><OrderTracker /></div>}
        {section === "security" && <div className="account-card"><div className="account-card-head"><div><small>Account access</small><h2>Security</h2></div></div><div className="security-list"><div><span>{user.emailVerified ? "✓" : "!"}</span><p><strong>Email address</strong><small>{user.emailVerified ? "Your email is verified." : "Verify your email to strengthen account recovery."}</small></p>{!user.emailVerified && <button onClick={() => void sendEmailVerification(user, emailActionSettings("/account")).then(() => setNotice("Verification email sent.")).catch((reason) => setNotice(customerErrorMessage(reason)))}>Send verification</button>}</div><div><span>••</span><p><strong>Password</strong><small>We&apos;ll send a secure reset link to {user.email}.</small></p><button onClick={() => user.email && void sendPasswordResetEmail(firebaseAuth(), user.email, emailActionSettings("/login?reset=complete")).then(() => setNotice("Password reset email sent.")).catch((reason) => setNotice(customerErrorMessage(reason)))}>Reset password</button></div><div><span>↗</span><p><strong>Privacy request</strong><small>Request a copy or deletion of your account data.</small></p><a href={`mailto:hello@printstore.ca?subject=${encodeURIComponent("Privacy request for " + (user.email ?? "Printstore account"))}`}>Email privacy team</a></div></div></div>}
      </section></div>
  </main>;
}

function Field({ label, value, onChange, type = "text", autoComplete, required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete: string; required?: boolean; disabled?: boolean }) { return <label>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} disabled={disabled} /></label>; }
