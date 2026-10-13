import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase/admin";
import { getPrintifyOrder } from "@/lib/printify/client";

export const dynamic = "force-dynamic";

interface PrintifyWebhookEvent {
  id: string;
  type: string;
  created_at: string;
  resource: { id: string; type: string; data?: { shop_id?: number | string; status?: string } | null };
}

function validSignature(body: string, supplied: string | null, secret: string) {
  if (!supplied) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: Request) {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const body = await request.text();
  if (!validSignature(body, request.headers.get("x-pfy-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: PrintifyWebhookEvent;
  try { event = JSON.parse(body) as PrintifyWebhookEvent; }
  catch { return NextResponse.json({ error: "Invalid payload." }, { status: 400 }); }
  if (!event.id || event.resource?.type !== "order" || !event.resource.id) return NextResponse.json({ received: true, ignored: true });
  const configuredShopId = process.env.PRINTIFY_SHOP_ID;
  if (event.resource.data?.shop_id && configuredShopId && String(event.resource.data.shop_id) !== configuredShopId) {
    return NextResponse.json({ error: "Shop mismatch." }, { status: 403 });
  }

  try {
    const database = adminFirestore();
    const eventRef = database.collection("printifyWebhookEvents").doc(event.id);
    if ((await eventRef.get()).exists) return NextResponse.json({ received: true, duplicate: true });
    const order = await getPrintifyOrder(event.resource.id);
    const matches = await database.collection("orders").where("printifyOrderId", "==", order.id).limit(5).get();
    await Promise.all(matches.docs.map((document) => document.ref.set({
      printifyStatus: order.status,
      printifySentToProductionAt: order.sent_to_production_at ?? null,
      printifyFulfilledAt: order.fulfilled_at ?? null,
      printifyShipments: order.shipments ?? [],
      fulfillmentUpdatedAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })));
    await eventRef.set({ type: event.type, printifyOrderId: order.id, receivedAt: new Date() });
    return NextResponse.json({ received: true });
  } catch (reason) {
    console.error("[printify/webhook] processing failed", reason instanceof Error ? reason.message : "unknown");
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
