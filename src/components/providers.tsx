"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export interface CartItem {
  productId: string;
  variantId: number;
  title: string;
  variantTitle: string;
  image: string;
  price: number;
  quantity: number;
}

interface AuthContextValue { user: User | null; loading: boolean }
interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: number, quantity: number) => void;
  removeItem: (productId: string, variantId: number) => void;
  clearCart: () => void;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });
const CartContext = createContext<CartContextValue | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth(), (nextUser) => {
    setUser(nextUser);
    setLoading(false);
  }), []);

  useEffect(() => {
    try {
      window.localStorage.removeItem("printstore-cart");
      const saved = window.localStorage.getItem("printstore-cart-v2");
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    if (cartReady) window.localStorage.setItem("printstore-cart-v2", JSON.stringify(items));
  }, [items, cartReady]);

  const cart = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (item) => setItems((current) => {
      const exists = current.find((entry) => entry.productId === item.productId && entry.variantId === item.variantId);
      return exists
        ? current.map((entry) => entry === exists ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
        : [...current, item];
    }),
    updateQuantity: (productId, variantId, quantity) => setItems((current) => current
      .map((item) => item.productId === productId && item.variantId === variantId ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0)),
    removeItem: (productId, variantId) => setItems((current) => current.filter((item) => item.productId !== productId || item.variantId !== variantId)),
    clearCart: () => {
      window.localStorage.removeItem("printstore-cart-v2");
      setItems([]);
    },
  }), [items]);

  return <AuthContext.Provider value={{ user, loading }}><CartContext.Provider value={cart}>{children}</CartContext.Provider></AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within Providers");
  return value;
}
