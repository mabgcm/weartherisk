import "server-only";

import type Stripe from "stripe";
import { adminFirestore } from "@/lib/firebase/admin";
import {
  createPrintifyOrder,
  findPrintifyOrderByExternalId,
  getPrintifyOrder,
  sendPrintifyOrderToProduction,
  type CreatePrintifyOrderInput,
  type PrintifyOrder,
} from "@/lib/printify/client";
import { stripe } from "@/lib/stripe/server";

type StoredItem = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

const ACTIVE_PRINTIFY_STATUSES = new Set([
  "sending-to-production",
  "in-production",
  "partially-fulfilled",
  "fulfilled",
]);

function recipientName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || "Customer",
    lastName: parts.join(" ") || "-",
  };
}

function printifyAddress(session: Stripe.Checkout.Session): CreatePrintifyOrderInput["address_to"] {
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address;
  const email = session.customer_details?.email?.trim();
  const phone = session.customer_details?.phone?.trim();
  if (!shipping?.name || !email || !phone || !address?.line1 || !address.city || !address.country || !address.postal_code) {
    throw new Error("STRIPE_SHIPPING_DETAILS_INCOMPLETE");
  }
  const { firstName, lastName } = recipientName(shipping.name);
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    country: address.country,
    region: address.state ?? "",
    address1: address.line1,
    ...(address.line2 ? { address2: address.line2 } : {}),
    city: address.city,
    zip: address.postal_code,
  };
}

function printifyLineItems(value: unknown): CreatePrintifyOrderInput["line_items"] {
  if (!Array.isArray(value) || !value.length) throw new Error("ORDER_ITEMS_MISSING");
  return value.map((item: StoredItem, index) => {
    if (typeof item.productId !== "string" || !Number.isInteger(item.variantId) || !Number.isInteger(item.quantity)) {
      throw new Error("ORDER_ITEMS_INVALID");
    }
    return {
      product_id: item.productId,
      variant_id: item.variantId as number,
      quantity: item.quantity as number,
      external_id: `item-${index + 1}`,
    };
  });
}

async function savePrintifySnapshot(sessionId: string, order: PrintifyOrder, extra: Record<string, unknown> = {}) {
  await adminFirestore().collection("orders").doc(sessionId).set({
    printifyOrderId: order.id,
    printifyStatus: order.status,
    printifyCreatedAt: order.created_at,
    printifySentToProductionAt: order.sent_to_production_at ?? null,
    printifyFulfilledAt: order.fulfilled_at ?? null,
    printifyShipments: order.shipments ?? [],
    fulfillmentUpdatedAt: new Date(),
    ...extra,
  }, { merge: true });
}

export async function fulfillPaidCheckout(sessionId: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { fulfilled: false, reason: "payment_not_paid" } as const;

  if (!session.livemode) {
    await adminFirestore().collection("orders").doc(sessionId).set({
      status: "test_payment_paid",
      paymentStatus: "paid",
      fulfillmentSkippedReason: "stripe_test_mode",
      updatedAt: new Date(),
    }, { merge: true });
    return { fulfilled: false, reason: "test_mode" } as const;
  }

  const database = adminFirestore();
  const orderRef = database.collection("orders").doc(sessionId);
  const lease = await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) throw new Error("CHECKOUT_ORDER_NOT_FOUND");
    const data = snapshot.data() ?? {};
    const leaseUntil = data.fulfillmentLeaseUntil?.toDate?.() as Date | undefined;
    if (!data.printifyOrderId && leaseUntil && leaseUntil.getTime() > Date.now()) return { acquired: false, data };
    transaction.set(orderRef, {
      status: "fulfillment_processing",
      fulfillmentLeaseUntil: new Date(Date.now() + 2 * 60 * 1000),
      fulfillmentAttempts: (typeof data.fulfillmentAttempts === "number" ? data.fulfillmentAttempts : 0) + 1,
      fulfillmentLastError: null,
      updatedAt: new Date(),
    }, { merge: true });
    return { acquired: true, data };
  });

  if (!lease.acquired) return { fulfilled: false, reason: "fulfillment_in_progress" } as const;

  try {
    let printifyOrder: PrintifyOrder | null = null;
    if (typeof lease.data.printifyOrderId === "string") {
      printifyOrder = await getPrintifyOrder(lease.data.printifyOrderId);
    } else {
      printifyOrder = await findPrintifyOrderByExternalId(sessionId);
      if (!printifyOrder) {
        const lineItems = printifyLineItems(lease.data.items);
        printifyOrder = await createPrintifyOrder({
          external_id: sessionId,
          label: `CPS-${sessionId.slice(-10).toUpperCase()}`,
          line_items: lineItems,
          shipping_method: 1,
          send_shipping_notification: true,
          address_to: printifyAddress(session),
        });
      }
      await savePrintifySnapshot(sessionId, printifyOrder, { status: "ready_for_production" });
    }

    if (!ACTIVE_PRINTIFY_STATUSES.has(printifyOrder.status)) {
      await sendPrintifyOrderToProduction(printifyOrder.id);
    }
    const currentOrder = await getPrintifyOrder(printifyOrder.id);
    await savePrintifySnapshot(sessionId, currentOrder, {
      status: "in_fulfillment",
      fulfillmentCompletedAt: new Date(),
      fulfillmentLeaseUntil: null,
      fulfillmentLastError: null,
    });
    return { fulfilled: true, printifyOrderId: currentOrder.id } as const;
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unknown fulfillment error";
    await orderRef.set({
      status: "fulfillment_failed",
      fulfillmentLeaseUntil: null,
      fulfillmentLastError: message.slice(0, 500),
      fulfillmentUpdatedAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    throw reason;
  }
}
