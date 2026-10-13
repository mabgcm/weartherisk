const token = process.env.PRINTIFY_API_TOKEN;
const shopId = process.env.PRINTIFY_SHOP_ID;
const secret = process.env.PRINTIFY_WEBHOOK_SECRET;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.canprintstore.com").replace(/\/$/, "");

if (!token || !shopId || !secret) {
  throw new Error("PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID and PRINTIFY_WEBHOOK_SECRET are required.");
}

const endpoint = `${siteUrl}/api/printify/webhook`;
const apiUrl = `https://api.printify.com/v1/shops/${encodeURIComponent(shopId)}/webhooks.json`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json;charset=utf-8", "User-Agent": "Printstore/1.0" };
const listResponse = await fetch(apiUrl, { headers });
if (!listResponse.ok) throw new Error(`Could not list Printify webhooks (${listResponse.status}).`);
const existing = await listResponse.json();
const topics = ["order:updated", "order:sent-to-production", "order:shipment:created", "order:shipment:delivered"];

for (const topic of topics) {
  const matching = existing.filter((webhook) => webhook.topic === topic && webhook.url === endpoint);
  for (const webhook of matching) {
    const deleteUrl = `https://api.printify.com/v1/shops/${encodeURIComponent(shopId)}/webhooks/${encodeURIComponent(webhook.id)}.json?host=${encodeURIComponent(new URL(endpoint).host)}`;
    const deleteResponse = await fetch(deleteUrl, { method: "DELETE", headers });
    if (!deleteResponse.ok) throw new Error(`Could not refresh ${topic} webhook (${deleteResponse.status}).`);
  }
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ topic, url: endpoint, secret }),
  });
  if (!response.ok) throw new Error(`Could not create ${topic} webhook (${response.status}).`);
}

process.stdout.write(`Printify order webhooks are configured for ${endpoint}.\n`);
