import { NextResponse } from "next/server";
import { adminFirestore, verifyFirebaseToken } from "@/lib/firebase/admin";
import { getPrintifyOrder } from "@/lib/printify/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext<"/api/orders/[orderId]">) {
  const user = await verifyFirebaseToken(request);
  if (!user?.uid) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const { orderId } = await context.params;
  const saved = await adminFirestore().collection("orders").doc(orderId).get();
  if (!saved.exists || saved.data()?.userId !== user.uid) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const printifyOrderId = saved.data()?.printifyOrderId;
  if (typeof printifyOrderId !== "string") return NextResponse.json({ error: "The order has not reached production yet." }, { status: 409 });

  try {
    const order = await getPrintifyOrder(printifyOrderId);
    return NextResponse.json({
      id: orderId,
      printifyOrderId: order.id,
      status: order.status,
      createdAt: order.created_at,
      sentToProductionAt: order.sent_to_production_at ?? null,
      fulfilledAt: order.fulfilled_at ?? null,
      items: order.line_items,
      address: order.address_to,
      shipments: order.shipments ?? [],
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Live production details are temporarily unavailable." }, { status: 502 });
  }
}
