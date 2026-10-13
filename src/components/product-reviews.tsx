"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers";

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  updatedAt: string | null;
}

interface ReviewResponse { reviews: Review[]; count: number; averageRating: number; error?: string }

async function fetchReviews(productId: string) {
  const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`);
  const payload = await response.json() as ReviewResponse;
  if (!response.ok) throw new Error(payload.error || "Reviews are unavailable.");
  return payload;
}

function Stars({ rating, label }: { rating: number; label?: string }) {
  return <span className="text-lg tracking-[0.12em] text-[#ef654f]" aria-label={label ?? `${rating} out of 5 stars`} role="img">
    {Array.from({ length: 5 }, (_, index) => index < Math.round(rating) ? "★" : "☆").join("")}
  </span>;
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReviewResponse>({ reviews: [], count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchReviews(productId)
      .then((payload) => { if (!cancelled) setData(payload); })
      .catch((reason: unknown) => { if (!cancelled) setNotice(reason instanceof Error ? reason.message : "Reviews are unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, title, body }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Your review could not be saved.");
      setTitle("");
      setBody("");
      setNotice("Thank you — your review is now published.");
      setData(await fetchReviews(productId));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Your review could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mt-20 border-t border-black/10 pt-12" aria-labelledby="reviews-title">
    <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Customer feedback</p>
        <h2 id="reviews-title" className="mt-3 text-4xl font-black tracking-tight">Product reviews</h2>
        <div className="mt-5 flex items-center gap-3"><Stars rating={data.averageRating} /><strong className="text-xl">{data.count ? data.averageRating.toFixed(1) : "—"}</strong><span className="text-sm text-black/50">({data.count} {data.count === 1 ? "review" : "reviews"})</span></div>
        {!authLoading && (user
          ? <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl bg-white p-6">
              <fieldset><legend className="text-sm font-bold">Your rating</legend><div className="mt-2 flex gap-1">{[1,2,3,4,5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className="cursor-pointer border-0 bg-transparent p-0 text-3xl text-[#ef654f]" aria-label={`${value} stars`}>{value <= rating ? "★" : "☆"}</button>)}</div></fieldset>
              <label className="text-sm font-bold">Review title<input required minLength={3} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 block w-full border border-black/20 p-3 font-normal" /></label>
              <label className="text-sm font-bold">Your review<textarea required minLength={10} maxLength={2000} rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="mt-2 block w-full resize-y border border-black/20 p-3 font-normal" /></label>
              <button disabled={busy} className="cursor-pointer rounded-full bg-emerald-900 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Publishing…" : "Publish review"}</button>
            </form>
          : <p className="mt-8 rounded-3xl bg-white p-6 text-sm leading-6"><Link href={`/login?next=${encodeURIComponent(`/products/${productId}`)}`} className="font-bold underline">Login</Link> to review a product you purchased.</p>)}
        {notice && <p className="mt-4 text-sm font-bold" role="status">{notice}</p>}
      </div>
      <div className="grid content-start gap-4">
        {loading ? <p className="rounded-3xl bg-white p-7 text-black/50">Loading reviews…</p> : data.reviews.length ? data.reviews.map((review) => <article key={review.id} className="rounded-3xl bg-white p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><Stars rating={review.rating} /><time className="text-xs text-black/45" dateTime={review.updatedAt ?? undefined}>{review.updatedAt ? new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(review.updatedAt)) : ""}</time></div>
          <h3 className="mt-4 text-xl font-black">{review.title}</h3><p className="mt-3 leading-7 text-black/65">{review.body}</p>
          <footer className="mt-5 flex flex-wrap items-center gap-3 text-xs"><strong>{review.authorName}</strong>{review.verifiedPurchase && <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">✓ Verified purchase</span>}</footer>
        </article>) : <div className="rounded-3xl bg-white p-10 text-center"><span className="text-4xl text-[#ef654f]">★★★★★</span><h3 className="mt-4 text-2xl font-black">No reviews yet</h3><p className="mt-2 text-black/55">Purchased this product? Be the first to share your experience.</p></div>}
      </div>
    </div>
  </section>;
}
