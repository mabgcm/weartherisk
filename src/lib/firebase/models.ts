import type { Timestamp } from "firebase/firestore";

export type Currency = "TRY" | "USD" | "EUR";
export type OrderStatus = "pending" | "paid" | "in_production" | "shipped" | "delivered" | "cancelled";

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrls: string[];
  active: boolean;
  providerId: string;
  variantIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductVariant {
  id: string;
  productId: string;
  providerVariantId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  currency: Currency;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Provider {
  id: string;
  name: string;
  type: "printful" | "printify" | "manual";
  active: boolean;
  metadata?: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingTotal: number;
  total: number;
  currency: Currency;
  providerOrderIds?: string[];
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode: string;
    country: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "customer" | "admin";
  phone?: string;
  marketingConsent?: boolean;
  addresses?: Array<{
    id: string; label: string; firstName: string; lastName: string; phone: string;
    address1: string; address2: string; city: string; region: string; postalCode: string;
    country: "CA" | "US"; isDefault: boolean;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const collections = {
  products: "products",
  productVariants: "productVariants",
  providers: "providers",
  orders: "orders",
  users: "users",
} as const;
