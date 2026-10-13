"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

export interface CustomerAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: "CA" | "US";
  isDefault: boolean;
}

export interface CustomerProfile {
  displayName: string;
  phone: string;
  email: string;
  marketingConsent: boolean;
  addresses: CustomerAddress[];
}

export const emptyAddress = (): CustomerAddress => ({ id: crypto.randomUUID(), label: "Home", firstName: "", lastName: "", phone: "", address1: "", address2: "", city: "", region: "", postalCode: "", country: "CA", isDefault: false });

export async function getCustomerProfile(userId: string, email: string): Promise<CustomerProfile> {
  const snapshot = await getDoc(doc(firestore(), "users", userId));
  const data = snapshot.data() as Partial<CustomerProfile> | undefined;
  return { displayName: data?.displayName ?? "", phone: data?.phone ?? "", email, marketingConsent: data?.marketingConsent ?? false, addresses: Array.isArray(data?.addresses) ? data.addresses.slice(0, 10) : [] };
}

export async function saveCustomerProfile(userId: string, profile: CustomerProfile) {
  const addresses = profile.addresses.slice(0, 10).map((address, index, list) => ({ ...address, isDefault: list.some((item) => item.isDefault) ? address.isDefault : index === 0 }));
  await setDoc(doc(firestore(), "users", userId), { ...profile, addresses, updatedAt: serverTimestamp() }, { merge: true });
}

export function customerErrorMessage(reason: unknown) {
  const code = typeof reason === "object" && reason && "code" in reason ? String(reason.code) : "";
  if (code.includes("permission-denied")) return "Profile access was denied by Firebase. Publish the updated Firestore security rules and try again.";
  if (code.includes("unavailable")) return "The profile service is temporarily unavailable. Check your connection and try again.";
  if (code.includes("not-found")) return "The Firestore database is not available for this project.";
  return "We couldn't save your changes. Please try again.";
}

export function normalizeDefaultAddress(addresses: CustomerAddress[], defaultId: string) {
  return addresses.map((address) => ({ ...address, isDefault: address.id === defaultId }));
}
