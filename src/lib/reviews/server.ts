import "server-only";

import { adminFirestore } from "@/lib/firebase/admin";

export interface PublishedReview {
  rating: number;
  title: string;
  body: string;
  authorName: string;
  updatedAt: string | null;
}

export async function getPublishedReviews(productId: string): Promise<PublishedReview[]> {
  try {
    const snapshot = await adminFirestore().collection("productReviews").where("productId", "==", productId).limit(100).get();
    return snapshot.docs.map((document) => document.data())
      .filter((review) => review.status === "published" && Number.isInteger(review.rating))
      .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
      .map((review) => ({ rating: review.rating, title: review.title, body: review.body, authorName: review.authorName, updatedAt: review.updatedAt?.toDate?.().toISOString() ?? null }));
  } catch {
    return [];
  }
}
