import { NextResponse } from "next/server";
import { adminFirestore, verifyFirebaseToken } from "@/lib/firebase/admin";
import { fulfillPaidCheckout } from "@/lib/orders/fulfillment";
import { getPrintifyOrder, type PrintifyOrder } from "@/lib/printify/client";
import { stripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

function dateValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function storedItems(order: Record<string, unknown>) {
  return Array.isArray(order.items) ? order.items as Array<Record<string, unknown>> : [];
}

function retailItem(items: Array<Record<string, unknown>>, productId: string, variantId: number) {
  return items.find((item) => item.productId === productId && item.variantId === variantId);
}

function publicPrintifyOrder(documentId: string, saved: Record<string, unknown>, order: PrintifyOrder) {
  const items = storedItems(saved);
  const currency = typeof saved.currency === "string" ? saved.currency : "CAD";
  const totalDetails = saved.totalDetails && typeof saved.totalDetails === "object" ? saved.totalDetails as { amount_shipping?: number; amount_tax?: number } : null;
  return {
    source: "printify",
    id: documentId,
    printifyOrderId: order.id,
    displayId: order.app_order_id ?? `CPS-${documentId.slice(-10).toUpperCase()}`,
    status: order.status,
    paymentStatus: typeof saved.paymentStatus === "string" ? saved.paymentStatus : "paid",
    currency,
    createdAt: order.created_at || dateValue(saved.createdAt),
    sentToProductionAt: order.sent_to_production_at ?? null,
    fulfilledAt: order.fulfilled_at ?? null,
    subtotal: typeof saved.amountSubtotal === "number" ? saved.amountSubtotal : saved.subtotal ?? 0,
    shippingTotal: totalDetails?.amount_shipping ?? (typeof saved.shippingTotal === "number" ? saved.shippingTotal : 0),
    taxTotal: totalDetails?.amount_tax ?? 0,
    total: typeof saved.amountTotal === "number" ? saved.amountTotal : saved.total ?? 0,
    address: {
      firstName: order.address_to.first_name ?? "",
      lastName: order.address_to.last_name ?? "",
      address1: order.address_to.address1 ?? "",
      address2: order.address_to.address2 ?? "",
      city: order.address_to.city ?? "",
      region: order.address_to.region ?? "",
      postalCode: order.address_to.zip ?? "",
      country: order.address_to.country ?? "",
      phone: order.address_to.phone ?? "",
    },
    items: order.line_items.map((item) => {
      const retail = retailItem(items, item.product_id, item.variant_id);
      return {
        productId: item.product_id,
        title: item.metadata?.title ?? (typeof retail?.title === "string" ? retail.title : "Can Print Store product"),
        variant: item.metadata?.variant_label ?? (typeof retail?.variantTitle === "string" ? retail.variantTitle : ""),
        sku: item.metadata?.sku ?? "",
        quantity: item.quantity,
        status: item.status,
        image: typeof retail?.image === "string" ? retail.image : "",
        unitAmount: currency === "CAD" && typeof retail?.unitAmount === "number" ? retail.unitAmount : null,
      };
    }),
    shipments: (order.shipments ?? []).map((shipment) => ({
      carrier: shipment.carrier,
      number: shipment.number,
      url: shipment.url,
      deliveredAt: shipment.delivered_at ?? null,
    })),
  };
}

function publicPendingOrder(documentId: string, order: Record<string, unknown>) {
  const items = storedItems(order);
  const totalDetails = order.totalDetails && typeof order.totalDetails === "object" ? order.totalDetails as { amount_shipping?: number; amount_tax?: number } : null;
  return {
    source: "checkout",
    id: documentId,
    printifyOrderId: null,
    displayId: `CPS-${documentId.slice(-10).toUpperCase()}`,
    status: typeof order.status === "string" ? order.status : "pending_payment",
    paymentStatus: typeof order.paymentStatus === "string" ? order.paymentStatus : null,
    currency: typeof order.currency === "string" ? order.currency : "CAD",
    createdAt: dateValue(order.createdAt),
    sentToProductionAt: null,
    fulfilledAt: null,
    subtotal: typeof order.amountSubtotal === "number" ? order.amountSubtotal : order.subtotal ?? 0,
    shippingTotal: totalDetails?.amount_shipping ?? (typeof order.shippingTotal === "number" ? order.shippingTotal : 0),
    taxTotal: totalDetails?.amount_tax ?? 0,
    total: typeof order.amountTotal === "number" ? order.amountTotal : order.total ?? 0,
    address: null,
    items: items.map((item) => ({
      productId: typeof item.productId === "string" ? item.productId : "",
      title: typeof item.title === "string" ? item.title : "Can Print Store product",
      variant: typeof item.variantTitle === "string" ? item.variantTitle : "",
      sku: "",
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      status: typeof order.status === "string" ? order.status : "pending_payment",
      image: typeof item.image === "string" ? item.image : "",
      unitAmount: typeof item.unitAmount === "number" ? item.unitAmount : null,
    })),
    shipments: [],
  };
}

async function reconcileCheckoutOrder(documentId: string, saved: Record<string, unknown>) {
  if (typeof saved.stripeCheckoutSessionId !== "string") return saved;
  const canReconcile = ["pending_payment", "processing_payment", "paid", "fulfillment_failed"].includes(String(saved.status));
  if (!canReconcile || saved.printifyOrderId) return saved;
  try {
    const session = await stripe().checkout.sessions.retrieve(saved.stripeCheckoutSessionId);
    if (session.payment_status !== "paid") return saved;
    await adminFirestore().collection("orders").doc(documentId).set({
      paymentStatus: "paid",
      status: "paid",
      amountSubtotal: session.amount_subtotal,
      amountTotal: session.amount_total,
      totalDetails: session.total_details,
      currency: session.currency?.toUpperCase() ?? "CAD",
      updatedAt: new Date(),
    }, { merge: true });
    await fulfillPaidCheckout(session.id);
    return (await adminFirestore().collection("orders").doc(documentId).get()).data() ?? saved;
  } catch (reason) {
    console.error("[api/orders] fulfillment reconciliation failed", { orderId: documentId, reason: reason instanceof Error ? reason.message : "unknown" });
    return (await adminFirestore().collection("orders").doc(documentId).get()).data() ?? saved;
  }
}

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseToken(request);
    if (!user?.uid) return NextResponse.json({ error: "Your session could not be verified. Sign out and sign in again." }, { status: 401 });
    const snapshot = await adminFirestore().collection("orders").where("userId", "==", user.uid).limit(100).get();
    const orders = await Promise.all(snapshot.docs.map(async (document) => {
      const saved = await reconcileCheckoutOrder(document.id, document.data());
      if (typeof saved.printifyOrderId === "string") {
        try {
          const printifyOrder = await getPrintifyOrder(saved.printifyOrderId);
          await document.ref.set({
            printifyStatus: printifyOrder.status,
            printifySentToProductionAt: printifyOrder.sent_to_production_at ?? null,
            printifyFulfilledAt: printifyOrder.fulfilled_at ?? null,
            printifyShipments: printifyOrder.shipments ?? [],
            fulfillmentUpdatedAt: new Date(),
          }, { merge: true });
          return publicPrintifyOrder(document.id, saved, printifyOrder);
        } catch (reason) {
          console.error("[api/orders] Printify order refresh failed", { orderId: document.id, reason: reason instanceof Error ? reason.message : "unknown" });
        }
      }
      return publicPendingOrder(document.id, saved);
    }));
    orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (reason) {
    console.error("[api/orders] live order lookup failed", reason instanceof Error ? reason.message : "unknown");
    return NextResponse.json({ error: "Live order status is temporarily unavailable." }, { status: 502 });
  }
}
