import "server-only";

const PRINTIFY_API_URL = "https://api.printify.com/v1";

export interface PrintifyImage {
  src: string;
  position: string;
  is_default: boolean;
  variant_ids: number[];
}

export interface PrintifyVariant {
  id: number;
  sku: string;
  title: string;
  price: number;
  cost: number;
  is_enabled: boolean;
  is_available: boolean;
}

export interface PrintifyPrintLayer {
  id?: string;
  type: string;
  input_text?: string;
  font_family?: string;
  font_size?: number;
  font_color?: string;
  src?: string;
  x?: number;
  y?: number;
  scale?: number;
  angle?: number;
  width?: number;
  height?: number;
}

export interface PrintifyPrintArea {
  variant_ids: number[];
  placeholders: Array<{
    position: string;
    images: PrintifyPrintLayer[];
  }>;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: PrintifyImage[];
  variants: PrintifyVariant[];
  visible: boolean;
  blueprint_id: number;
  print_provider_id: number;
  print_areas?: PrintifyPrintArea[];
  sales_channel_properties?: unknown[];
}

interface PrintifyProductPage {
  current_page: number;
  last_page: number;
  data: PrintifyProduct[];
}

export interface PrintifyShipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at?: string;
}

export interface PrintifyOrder {
  id: string;
  external_id?: string;
  app_order_id?: string;
  status: string;
  created_at: string;
  sent_to_production_at?: string;
  fulfilled_at?: string;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  address_to: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    country?: string;
    region?: string;
    address1?: string;
    address2?: string;
    city?: string;
    zip?: string;
  };
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
    status: string;
    metadata?: { title?: string; variant_label?: string; sku?: string };
  }>;
  shipments?: PrintifyShipment[];
}

interface PrintifyOrderPage {
  current_page: number;
  last_page: number;
  data: PrintifyOrder[];
}

export interface CreatePrintifyOrderInput {
  external_id: string;
  label?: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
    external_id?: string;
  }>;
  shipping_method: 1 | 2 | 3 | 4;
  send_shipping_notification: boolean;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

export class PrintifyApiError extends Error {
  constructor(public status: number, public responseBody: string) {
    super(`Printify request failed with status ${status}.`);
    this.name = "PrintifyApiError";
  }
}

export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintifyProvider {
  id: number;
  title: string;
  decoration_methods: string[];
}

export interface PrintifyCatalogVariant {
  id: number;
  title: string;
  options: Record<string, string>;
  decoration_methods: string[];
  placeholders?: Array<{ position: string; decoration_method: string; width: number; height: number }>;
}

interface PrintifyVariantResponse {
  id: number;
  title: string;
  variants: PrintifyCatalogVariant[];
}

function getPrintifyConfig() {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    throw new Error("PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID must be configured.");
  }

  return { token, shopId };
}

async function printifyRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = getPrintifyConfig();
  const response = await fetch(`${PRINTIFY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "Printstore/1.0",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 2000);
    throw new PrintifyApiError(response.status, responseBody);
  }

  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return (body ? JSON.parse(body) : undefined) as T;
}

export async function getPrintifyProducts(): Promise<PrintifyProduct[]> {
  const { shopId } = getPrintifyConfig();
  const firstPage = await printifyRequest<PrintifyProductPage>(
    `/shops/${shopId}/products.json?limit=50`,
    { next: { revalidate: 300 } },
  );

  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.last_page - 1) }, (_, index) =>
      printifyRequest<PrintifyProductPage>(
        `/shops/${shopId}/products.json?limit=50&page=${index + 2}`,
        { next: { revalidate: 300 } },
      ),
    ),
  );

  return [firstPage, ...remainingPages]
    .flatMap((page) => page.data)
    .filter((product) => product.visible);
}

export async function getPrintifyProduct(productId: string): Promise<PrintifyProduct> {
  const { shopId } = getPrintifyConfig();
  return printifyRequest<PrintifyProduct>(`/shops/${shopId}/products/${productId}.json`, {
    next: { revalidate: 300 },
  });
}

export async function getPrintifyOrders(page = 1): Promise<PrintifyOrderPage> {
  const { shopId } = getPrintifyConfig();
  return printifyRequest<PrintifyOrderPage>(`/shops/${shopId}/orders.json?limit=50&page=${page}`, {
    cache: "no-store",
  });
}

export async function getPrintifyOrder(orderId: string): Promise<PrintifyOrder> {
  const { shopId } = getPrintifyConfig();
  return printifyRequest<PrintifyOrder>(`/shops/${shopId}/orders/${encodeURIComponent(orderId)}.json`, {
    cache: "no-store",
  });
}

export async function findPrintifyOrderByExternalId(externalId: string) {
  let page = 1;
  do {
    const response = await getPrintifyOrders(page);
    const match = response.data.find((order) => order.external_id === externalId);
    if (match) return match;
    if (page >= response.last_page) return null;
    page += 1;
  } while (page <= 100);
  return null;
}

export function createPrintifyOrder(input: CreatePrintifyOrderInput) {
  const { shopId } = getPrintifyConfig();
  return printifyRequest<PrintifyOrder>(`/shops/${shopId}/orders.json`, {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
}

export function sendPrintifyOrderToProduction(orderId: string) {
  const { shopId } = getPrintifyConfig();
  return printifyRequest<void>(`/shops/${shopId}/orders/${encodeURIComponent(orderId)}/send_to_production.json`, {
    method: "POST",
    cache: "no-store",
  });
}

export function getPrintifyBlueprints() {
  return printifyRequest<PrintifyBlueprint[]>("/catalog/blueprints.json", {
    next: { revalidate: 3600 },
  });
}

export function getPrintifyBlueprint(blueprintId: number) {
  return printifyRequest<PrintifyBlueprint>(`/catalog/blueprints/${blueprintId}.json`, {
    next: { revalidate: 3600 },
  });
}

export function getPrintifyProviders(blueprintId: number) {
  return printifyRequest<PrintifyProvider[]>(`/catalog/blueprints/${blueprintId}/print_providers.json`, {
    next: { revalidate: 3600 },
  });
}

export async function getPrintifyVariants(blueprintId: number, providerId: number) {
  const response = await printifyRequest<PrintifyVariantResponse>(
    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
    { next: { revalidate: 3600 } },
  );

  return response.variants;
}
