import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigurationError";
  }
}

function adminApp() {
  const webProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || webProjectId;
  if (!projectId) throw new FirebaseAdminConfigurationError("Firebase project ID is not configured.");
  if (webProjectId && projectId !== webProjectId) {
    throw new FirebaseAdminConfigurationError("Firebase Admin and web app project IDs must match.");
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) {
    throw new FirebaseAdminConfigurationError("FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured on the server.");
  }
  if (getApps().length) return getApp();
  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  } catch {
    throw new FirebaseAdminConfigurationError("Firebase Admin service account credentials are invalid.");
  }
}

const INVALID_TOKEN_CODES = new Set([
  "auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired",
  "auth/id-token-revoked", "auth/user-disabled",
]);

export async function verifyFirebaseToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const app = adminApp();
  try {
    return await getAuth(app).verifyIdToken(authorization.slice(7));
  } catch (reason) {
    const code = reason && typeof reason === "object" && "code" in reason ? String(reason.code) : "";
    if (INVALID_TOKEN_CODES.has(code)) return null;
    // Configuration and upstream service failures must not masquerade as a signed-out user.
    console.error("[firebase/admin] token verification unavailable", { code: code || "unknown" });
    throw new Error("Firebase token verification is temporarily unavailable.");
  }
}

export function adminFirestore() {
  return getFirestore(adminApp());
}
