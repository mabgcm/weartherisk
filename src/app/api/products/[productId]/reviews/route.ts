import { NextResponse } from "next/server";
import { adminFirestore, verifyFirebaseToken } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

interface ReviewInput { rating?: unknown; title?: unknown; body?: unknown }

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function reviewId(productId: string, userId: string) {
  return `${productId}_${userId}`;
}

export async function GET(_request: Request, context: RouteContext<"/api/products/[productId]/reviews">) {
  try {
    const { productId } = await context.params;
    const snapshot = await adminFirestore().collection("productReviews").where("productId", "==", productId).limit(100).get();
    const reviews = snapshot.docs
      .map((document) => document.data())
      .filter((review) => review.status === "published")
      .sort((a, b) => b.updatedAt?.toMillis?.() - a.updatedAt?.toMillis?.())
      .map((review) => ({
        id: reviewId(productId, review.userId),
        rating: review.rating,
        title: review.title,
        body: review.body,
        authorName: review.authorName,
        verifiedPurchase: review.verifiedPurchase === true,
        updatedAt: review.updatedAt?.toDate?.().toISOString() ?? null,
      }));
    const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    return NextResponse.json({ reviews, count: reviews.length, averageRating });
  } catch (reason) {
    console.error("[api/reviews] review lookup failed", reason);
    return NextResponse.json({ error: "Reviews are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext<"/api/products/[productId]/reviews">) {
  try {
    const user = await verifyFirebaseToken(request);
    if (!user?.uid || !user.email) return NextResponse.json({ error: "Sign in to write a review." }, { status: 401 });
    const { productId } = await context.params;
    const input = await request.json() as ReviewInput;
    const rating = Number(input.rating);
    const title = cleanText(input.title, 100);
    const body = cleanText(input.body, 2000);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 3 || body.length < 10) {
      return NextResponse.json({ error: "Choose a rating and write a title and review." }, { status: 400 });
    }

    const database = adminFirestore();
    const orders = await database.collection("orders").where("userId", "==", user.uid).limit(100).get();
    const verifiedPurchase = orders.docs.some((document) => {
      const order = document.data();
      return order.status === "paid" && Array.isArray(order.items) && order.items.some((item: { productId?: unknown }) => item.productId === productId);
    });
    if (!verifiedPurchase) return NextResponse.json({ error: "Only customers who purchased this product can review it." }, { status: 403 });

    const profile = await database.collection("users").doc(user.uid).get();
    const displayName = cleanText(profile.data()?.displayName, 60);
    const authorName = displayName || user.email.split("@")[0];
    const reference = database.collection("productReviews").doc(reviewId(productId, user.uid));
    const existing = await reference.get();
    const now = new Date();
    await reference.set({
      productId,
      userId: user.uid,
      rating,
      title,
      body,
      authorName,
      verifiedPurchase: true,
      status: "published",
      createdAt: existing.data()?.createdAt ?? now,
      updatedAt: now,
    }, { merge: true });
    return NextResponse.json({ saved: true });
  } catch (reason) {
    console.error("[api/reviews] review save failed", reason);
    return NextResponse.json({ error: "Your review could not be saved. Please try again." }, { status: 500 });
  }
}
