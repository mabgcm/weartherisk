# Printstore project guide

Can Print Store is a Canadian print-on-demand storefront for original apparel, mugs, art prints, accessories, and home décor. Shoppers browse Printify products, sign in through Firebase, pay through Stripe-hosted Checkout, and follow production and shipments in their account. Operators browse Printify blueprints here; artwork/product publishing and most operational administration happen outside this application.

Verified: **2026-10-12** (America/Toronto). Inspected commit: **`193e1b2a66dcc82357eeb9b90f69e3900f9a7b7c`**. The working tree was clean before this documentation change.

Evidence labels: **Code-verified** means supported by inspected source/configuration, not a successful live integration test. **Historically reported** means a Git commit description, with implementation differences checked where specified. **Unverified** means no local evidence establishes the claim. Unless otherwise labeled, descriptions below are code-verified. No environment values, customer records, credentials, or personal data were inspected for this guide.

## Read first

1. `AGENTS.md`: mandatory version-specific Next.js guidance. Read the relevant installed documentation in `node_modules/next/dist/docs/` before writing code; retain its generated instruction block. `CLAUDE.md` references `AGENTS.md`.
2. This guide's **Critical flows**, **Access rules**, and **Limitations** before touching orders, reviews, or authentication.
3. `package.json`, `.env.local.example`, `src/app/layout.tsx`, and `src/components/providers.tsx` for runtime, configuration, shared shell, and client state.
4. `src/lib/printify/client.ts`, `src/app/api/checkout/route.ts`, and `src/lib/orders/fulfillment.ts` for catalog, payment, and production boundaries.
5. Use **Task-to-files and verification** to read only the files relevant to the task. `README.md` is a brief Turkish starter description; its Firestore product model is not the current storefront catalog source.

## Stack and infrastructure

Single Next.js App Router application, TypeScript, React, Tailwind CSS, Firebase Auth/Firestore, Firebase Admin, Stripe SDK, and server-side Printify REST API (`/v1`). No separate backend service, queue worker, SQL database, or custom deployment pipeline is tracked.

| Package | Declared in `package.json` | Resolved in `package-lock.json` |
| --- | --- | --- |
| Next.js / eslint-config-next | `16.3.0` | `16.3.0` |
| React / React DOM | `19.2.8` | `19.2.8` |
| @next/third-parties | `^16.3.1` | `16.3.1` |
| Firebase / Firebase Admin | `^12.17.1` / `^13.6.0` | `12.17.1` / `13.6.0` |
| Stripe | `^22.5.0` | `22.5.0` |
| Tailwind CSS | `^4.1.14` | `4.3.3` |
| TypeScript / ESLint | `^5.9.2` / `^9.36.0` | `5.9.3` / `9.39.5` |

Node engine is `>=20.19.0`; `.nvmrc` selects Node 22. npm scripts invoke the executable in `$NODE`, which must be set. `tsconfig.json` enables strict checking, bundler resolution, and `@/*` → `src/*`. `postcss.config.mjs` uses `@tailwindcss/postcss`; `eslint.config.mjs` uses Next core-web-vitals and TypeScript rules.

Firebase browser setup exposes Auth, Firestore, Storage, and an optional analytics helper; no current upload flow uses Storage, and `firebaseAnalytics()` is not called by application code. Server libraries use `server-only`. Admin SDK uses explicit service-account credentials and bypasses Firestore client rules, so API handlers must enforce access themselves.

Vercel is named in policy copy, `/api/region` reads its geo header, and `.vercel` is ignored. **Unverified:** actual hosting account, deployment target, regions, Firebase project/database location, production credentials, tax registrations, webhook subscriptions, analytics delivery, and provider dashboard settings. No tracked `vercel.json`, `.firebaserc`, CI workflow, Dockerfile, hosting configuration, or emulator configuration establishes these.

## Repository map and routes

| Path | Responsibility |
| --- | --- |
| `src/app/layout.tsx` | Global metadata/JSON-LD, Google fonts, catalog-derived navigation, providers, header/footer, GA4 |
| `src/app/globals.css` | Theme variables, storefront styling, responsive rules, menu/account/tracking layouts |
| `src/components/providers.tsx` | `Providers`, `useAuth`, `useCart`; Firebase auth subscription and browser cart |
| `src/lib/catalog/{categories,storefront}.ts` | Canonical category mapping and `getStorefrontCatalog()` |
| `src/lib/printify/client.ts` | Typed product/blueprint/provider/order models and API methods |
| `src/lib/firebase/{client,admin,customer,action-settings,models}.ts` | Browser/server SDKs, token verification, profile persistence, email action links, starter models |
| `src/lib/stripe/server.ts` | Lazy singleton `stripe()` |
| `src/lib/orders/fulfillment.ts` | `fulfillPaidCheckout()` and Printify production submission |
| `src/lib/reviews/server.ts`, `src/lib/seo.ts` | Published reviews for structured data; URLs, plain text, descriptions, safe JSON-LD |
| `public/images/{logo,logoSQR,fav}.png`, `public/og-printstore.png` | Branding and social image assets |
| `firestore.rules`, `firestore.indexes.json`, `firebase.json` | Client access policy and Firestore deployment configuration; no composite indexes declared |
| `scripts/configure-printify-webhooks.mjs` | Refreshes four remote Printify order webhook subscriptions |

Page files follow `src/app/<route>/page.tsx`:

| URL | Behavior / collaborating files |
| --- | --- |
| `/` | Dynamic home; first product is hero, first eight are featured; category circles, editorial sections, newsletter form |
| `/categories/[slug]` | `CategoryPage`; category products, eight per page; `sort=price-low`, `price-high`, `name`, default upstream order; `page` query |
| `/products/[productId]` | `ProductPage`, `generateMetadata`; published product, four-image gallery, available variants, `AddToCart`, `ProductReviews` |
| `/cart` | Browser cart, quantity selector 1–10, removal and subtotal |
| `/checkout` | Client auth/cart gates and POST to checkout API; address/phone collected at Stripe |
| `/checkout/success` | Server checks `session_id`, confirms payment, attempts fulfillment; `ClearPaidCart` runs only for confirmed paid sessions |
| `/login`, `/register`, `/forgot-password` | `AuthForm`; Firebase email/password and reset emails; login/register honor `next` query |
| `/auth/action` | Suspense-wrapped `FirebaseActionHandler`; reset/verification codes and continuation |
| `/account` | `AccountDashboard`; profile, consent, order history, security emails, sign out, mail-based privacy request |
| `/track-order` | `OrderTracker`; signed-in user's orders, local ID search, expandable details, 60-second refresh and manual refresh |
| `/admin/catalog` | Read-only blueprint browser; `q` searches title/brand/model, 24 per page |
| `/admin/catalog/[blueprintId]` | Blueprint detail, `provider` selection, colors/sizes/decoration; no product creation action |
| `/about`, `/faq`, `/shipping`, `/privacy`, `/terms` | Static brand/help/policy copy; FAQ accordion and FAQPage JSON-LD |

API implementations are `src/app/api/<URL suffix>/route.ts`:

| Method / URL | Access and effect |
| --- | --- |
| `POST /api/checkout` | Firebase bearer token with UID/email; validates cart, creates Stripe session, stores pending order, returns hosted URL |
| `POST /api/stripe/webhook` | Raw-body Stripe signature; records payment/refund events, triggers paid fulfillment, deduplicates by event ID |
| `POST /api/printify/webhook` | Raw-body HMAC `x-pfy-signature`, optional shop-ID mismatch check; retrieves live order and updates matching stored orders |
| `GET /api/orders` | Firebase UID ownership query, up to 100; may reconcile payment/submit production, fetches live Printify data; private/no-store |
| `GET /api/orders/[orderId]` | UID ownership; 404 for missing/other owner's order, 409 until Printify ID exists; live detail, private/no-store |
| `GET /api/products/[productId]/reviews` | Public published reviews, up to 100, count/average |
| `POST /api/products/[productId]/reviews` | Firebase UID/email and purchase eligibility; one immediately published review per user/product |
| `GET /api/region` | Public; returns `x-vercel-ip-country` or null; private/no-store |

Additional endpoints: `src/app/sitemap.ts` → `/sitemap.xml`, `src/app/robots.ts` → `/robots.txt`, `src/app/llms.txt/route.ts` → `/llms.txt`.

## Design system

`globals.css` defines ink `#18332e`, cream `#f6f1e7`, paper `#fffdf7`, coral `#f16346`, sage `#b8ccad`, yellow `#f3c842`, lilac `#cfc2e7`. `layout.tsx` loads DM Sans (`--font-sans`) and Playfair Display (`--font-serif`, normal/italic), Latin subsets and `display: swap`. Sans handles body/bold headings; serif emphasizes editorial phrases.

Shared visual patterns: dark announcement strip, translucent sticky header, logo, cart badge, right-side menu drawer, cream/paper backgrounds, coral accents, pill CTAs, rounded image cards, circular category imagery, oversized tight headings, serif italic text, and dark manifesto/footer. Account/checkout use bordered white panels; orders use native `<details>` rows and a four-stage progress display. Product/admin/auth pages also use Tailwind utilities with emerald accents; styles are not consolidated into a reusable component library.

Desktop: split home hero, multi-column collections, product gallery plus sticky purchase panel, account sidebar, checkout summary column. CSS breakpoints mainly 950/800/650/600px; collections reduce four → three → two columns, mobile category/style tracks scroll horizontally, account/checkout stack, and fields become one column. Tailwind `sm`/`lg`/`xl` utilities also govern product/admin grids. Menu supports Escape, overlay dismissal, ARIA dialog labeling, and body scroll lock; no focus trap is implemented. Reduced-motion CSS disables transitions and smooth scrolling. Inspect all later CSS overrides before changing earlier selectors.

## Catalog and business rules

- `getPrintifyProducts()` fetches every shop product page (50/page, remaining pages in parallel) and returns only `visible` products. Enabled **and** available variants determine selectable options and minimum prices. Product failure/hidden product becomes 404; home/layout catalog errors fall back to empty data.
- `STORE_CATEGORIES` is the canonical blueprint mapping: `t-shirts` displays **Apparel**, plus `mugs`, `art-prints`, `accessories`, `home-living`. Blueprint ID or title/tag regex can match; matching categories can overlap. Unmatched blueprints receive generated categories using blueprint title, first tag, or ID and collision-aware slugs. Layout navigation hides empty categories when products exist.
- Prices are interpreted as integer CAD minor units; display divides by 100. Regional footer labels do not change storefront prices. Stripe Adaptive Pricing is requested for supported local checkout currencies.
- Server checkout accepts 1–20 cart entries, integer quantity 1–10, product string ID and numeric integer variant ID. Repeated additions can exceed the client selector's limit; server rejects invalid quantities. Product/variant visibility and price are revalidated from the Printify helper, never trusted from browser totals.
- Standard shipping: CAD 799 minor units below merchandise subtotal 7500, otherwise free. Stripe calculates exclusive taxes. Delivery estimate at Checkout is 5–10 business days; shipping copy separately describes 2–5 production days. Delivery countries are CA/US.
- Policy copy states made-to-order change-of-mind returns are generally unavailable, damage/defect claims within 30 days, and cancellation after production is not guaranteed. These are published policies, not automated claim/cancellation enforcement or verified service guarantees. Facilities vary by product/partner; footer's Canada wording is not proof all production occurs in Canada.
- No local artwork editor, personalization flow, publishing action, refund/cancel dashboard, moderation UI, or mailing-list service is implemented. Address model/helpers/styles remain, but current account UI has only profile/orders/security and Checkout sends only cart items.

## Data models and access rules

Firestore is document-based. Current writers in route handlers are authoritative; `src/lib/firebase/models.ts` contains starter contracts (`Product`, `ProductVariant`, `Provider`, `Order`, `UserProfile`, `collections`) that differ from live data. In particular its currencies TRY/USD/EUR omit CAD, its variants use string IDs, and its order status union omits checkout/fulfillment states. Do not use these types as a migration/schema specification.

| Collection / key | Important current fields and relationships |
| --- | --- |
| `users/{Firebase UID}` | `displayName`, `phone`, `email`, `marketingConsent`, `addresses`, `updatedAt`; owner profile saved with merge. Rules additionally permit `photoURL`, `privacyRequest`, `createdAt`; no role field permitted on client writes. Profile creation need not set `createdAt`. Address helpers cap at ten; fields include ID/label, recipient, phone, street/city/region/postalCode, CA/US country, `isDefault`. |
| `orders/{Stripe Checkout session ID}` | `userId` → Auth UID; `email`, `status`, `currency`, `subtotal`, `shippingTotal`, `total`, `items[]`, `stripeCheckoutSessionId`, creation/update timestamps. Items: `productId` → Printify product, numeric `variantId`, quantity/title/variantTitle/`unitAmount`/image. Initial amounts are CAD pre-tax estimates. |
| Order payment additions | `paymentStatus`, `stripePaymentIntentId`, `stripeCustomerId`, `customerDetails`, `stripeShippingDetails`, `amountSubtotal`, `amountTotal`, `totalDetails`, `paidAt`; Stripe settled currency/totals take precedence in order API responses. |
| Order fulfillment additions | `printifyOrderId`, `printifyStatus`, `printifyCreatedAt`, `printifySentToProductionAt`, `printifyFulfilledAt`, `printifyShipments`, `fulfillmentUpdatedAt`, `fulfillmentCompletedAt`, `fulfillmentLeaseUntil`, `fulfillmentAttempts`, `fulfillmentLastError`, test-mode `fulfillmentSkippedReason`. Shipments include carrier/number/URL/delivery date. |
| `productReviews/{productId}_{UID}` | Product/user relationship; rating 1–5, title (3–100), body (10–2000), authorName, verifiedPurchase, status `published`, timestamps. Text trimmed/whitespace-normalized; update preserves creation timestamp. Public responses expose author name and a review ID containing UID. |
| `stripeWebhookEvents/{event ID}` | Event type and processed timestamp; marker written after successful processing |
| `printifyWebhookEvents/{event ID}` | Type, Printify order ID, received timestamp; marker after successful processing |

Starter catalog collections `products`, `productVariants`, `providers` exist in types/rules/README, but current storefront reads Printify instead. Starter product relationships are providerId/variantIds and variant.productId/providerVariantId; provider types include Printful/manual without corresponding active integrations.

`firestore.rules` client permissions:

- Products/variants: public read, no write. Providers: no read/write.
- Users: owner-only read/create/update; allowed-key list and address count ≤10, delete denied. No comprehensive field-type/address validation.
- Orders: signed-in user can create a document with their own `userId`, read their own documents, never update/delete. **Important:** create does not restrict other fields; a client could forge order status/items. Server review eligibility trusts these records; see limitations.
- Reviews: no direct client access; public reads/authenticated writes occur through Admin-backed APIs. Webhook event collections and other unmatched paths have no client grant.
- No implemented admin role authorization. Blueprint pages under `/admin` are accessible without an auth check; robots exclusions are not access control.

## Critical flows

**Authentication:** `Providers` listens to `onAuthStateChanged(firebaseAuth())`; `AuthForm` uses Firebase email/password register/login/reset. Registration UI requires six characters; custom reset handler requires eight characters with a letter and number. Account security sends verification/reset emails; verified email is not required to checkout. Server requests use `Authorization: Bearer <Firebase ID token>`; `verifyFirebaseToken()` returns null on missing/invalid token or verification failure. No server session cookie or route middleware/proxy is implemented. Order access is UID-based despite tracker copy referring to email matching.

**Cart:** `printstore-cart-v2` in localStorage stores `CartItem[]` with product/variant identity, display data, integer price and quantity. `Providers` removes legacy `printstore-cart` on initialization. Cart persists across sign-in/out and is not scoped to UID. `AddToCart` merges matching product/variant and Buy now navigates to Checkout.

**Payment:** `/checkout` gets ID token, posts only product/variant/quantity with a fresh UUID idempotency header, then redirects to Stripe. API verifies catalog, computes base shipping, requests automatic tax and adaptive pricing, collects shipping address/phone, creates recovery-enabled session, links UID through metadata/client reference, and stores pending order under session ID. Header keys must match 16–200 alphanumeric/underscore/hyphen characters; otherwise fallback hash includes UID/cart and minute bucket. Success/cancel origins come from request URL, not `SITE_URL`.

**Payment confirmation:** Stripe webhook verifies signature on raw body. Handles completed/async succeeded, async failed, expired, and `charge.refunded`; refunds update status but do not cancel Printify production. Paid events retrieve current session, store payment facts, then call `fulfillPaidCheckout`. `/checkout/success?session_id=...` independently retrieves Stripe session and calls fulfillment when paid; it has no UID ownership check, returns generic confirmation, and clears cart only after payment confirmation. Account `/api/orders` also reconciles eligible pending/processing/paid/failed orders lacking a Printify ID. Thus GET order reads can produce external side effects.

**Fulfillment:** `fulfillPaidCheckout()` retrieves Stripe payment state first. Unpaid returns without production; `livemode=false` writes `test_payment_paid`, records skip reason, and creates no Printify order. Live mode requires stored order, acquires transaction lease (two minutes), increments attempts, then retrieves existing Printify ID or scans up to 100 order pages by external ID (Stripe session ID) before creating. Recipient/address/email/phone come from confirmed Stripe data. Creates standard-shipping order with shipping notifications enabled, snapshots ID, submits production unless already sending/in production/partially fulfilled/fulfilled, refreshes state, and clears lease. Failure writes `fulfillment_failed` and bounded error string and rethrows. This is duplicate mitigation, not a verified exactly-once guarantee.

**Notifications/tracking:** Firebase sends account emails. Printify order creation requests shipping notification; actual partner delivery is unverified. No application SMTP/transactional-email integration exists. Printify webhook authenticates `sha256=` HMAC using constant-time comparison and updates snapshots. Order list/detail fetch live Printify orders with no-store; list falls back to checkout-shaped data if live lookup fails. `OrderTracker` polls every 60 seconds and shows retailer amounts instead of Printify production costs; non-CAD fulfilled unit prices are omitted to avoid displaying CAD item prices as converted prices.

## Environment variables

Use `.env.local.example` as a names-only setup template; never commit `.env.local` or server secrets. `NEXT_PUBLIC_` settings are browser-visible. The current template omits `NEXT_PUBLIC_SITE_URL`.

| Names | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web app/API identification and Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase project/app identification |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Web SDK storage/messaging configuration; both required by current initialization |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional Firebase analytics configuration, distinct from hardcoded GA4 component |
| `FIREBASE_PROJECT_ID` | Admin project; falls back to public project ID |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Server service-account credentials; escaped newlines normalized by `adminApp()` |
| `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID` | Server API authorization and target shop; required even for catalog helper configuration |
| `PRINTIFY_WEBHOOK_SECRET` | Shared HMAC secret for webhook handler and registration script |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Server Stripe client and webhook signature verification |
| `NEXT_PUBLIC_SITE_URL` | Canonical/structured-data/sitemap/robots origin and Printify webhook registration origin; defaults to public store domain in `src/lib/seo.ts` |
| `NODE` | Shell executable path used by every npm script; set with `export NODE="$(command -v node)"` |

## SEO, analytics, performance, caching

`layout.tsx` defines title template, en-CA metadata, OG/Twitter cards, favicon and OnlineStore/WebSite JSON-LD. Home emits ItemList; categories emit CollectionPage/ItemList/breadcrumbs; products emit Product/offers/breadcrumbs and actual published review aggregate when available; FAQ emits FAQPage. `safeJsonLd()` escapes `<`; descriptions strip HTML and truncate to 160 characters. Product URLs use Printify IDs, not starter slugs.

`sitemap.ts` includes published products/populated categories and five informational pages; failure omits catalog entries. `robots.ts` excludes admin/API/account/cart/checkout/auth URLs and provides named crawler rules. Account/tracking/auth/cart/checkout set noindex metadata; admin pages have no explicit noindex metadata (robots disallow alone does not guarantee removal from search). `/llms.txt` lists live categories/products with public CDN cache headers (`s-maxage=300`, stale-while-revalidate 3600).

GA4 is mounted globally through `GoogleAnalytics` in `layout.tsx` with a hardcoded measurement ID; no custom ecommerce events, consent gate/banner, or environment switch is implemented. Privacy copy describes analytics. Firebase analytics helper is separate and unused.

Printify helpers request 300-second product revalidation and 3600-second blueprint/provider/variant revalidation; order reads/writes use no-store. Home and API handlers explicitly use `force-dynamic`. Effective product-cache reuse also depends on route/framework behavior; Checkout calls the same product helper rather than explicitly fetching uncached prices. There is no webhook-driven catalog invalidation. Firestore review reads are not explicitly cached. `next.config.ts` permits remote images only from two Printify image hosts; Next Image handles responsive sizes/priority assets. Fonts use Next font loading. Root layout fetches catalog for navigation on every render path; large catalog/order queries and repeated polling can increase external calls.

## Local setup, commands, deployment

Typical setup (instructions only; not executed for this documentation):

```sh
nvm use
export NODE="$(command -v node)"
npm ci
cp .env.local.example .env.local
npm run dev
```

Fill environment settings privately. Firebase Console must have matching Web App, email/password Auth, Firestore database, authorized development/production domains, and email templates/action handler configuration compatible with `/auth/action`; remote configuration is unverified. Configure server service account, Printify shop/token, and Stripe test-mode credentials for development. Next defaults to local port 3000 unless overridden.

| Command | Effect / requirements |
| --- | --- |
| `npm run dev` | Next development server |
| `npm run build` | Production build; Next font download and catalog rendering may need network/configuration |
| `npm run start` | Serve existing production build |
| `npm run lint` | ESLint whole repository |
| `"$NODE" node_modules/typescript/bin/tsc --noEmit` | Optional type check; generated Next route types must exist from dev/build/typegen |
| `firebase deploy --only firestore --project <project-id>` | Deploy rules/indexes using separately installed/authenticated Firebase CLI; README also lists command without project flag |
| `npm run setup:printify-webhooks` | Loads `.env.local`, deletes matching topic/URL subscriptions and recreates them remotely; operational mutation, not a read-only check |

Printify script registers `order:updated`, `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered` at site origin + `/api/printify/webhook`. Stripe subscription must cover handler events above at `/api/stripe/webhook`; no registration script is tracked. Configure deployment environment before build/runtime, publicly reachable webhook URLs, and consistent Firebase project credentials. No application deployment command is defined beyond build/start; production hosting setup must be confirmed before deployment. No automated test suite or `test` script is tracked.

## Previous changes and troubleshooting

Available conversation contains only the guide request, approval, and Next.js instructions; no prior incident conversation is available. Commit subjects report fixes, but do not establish observed production symptoms or root causes. The following implementation changes were verified from diffs; causes remain **unverified** unless reproduced.

| Historical evidence | Verified implementation / current behavior | If the issue recurs |
| --- | --- | --- |
| `91b6146`, historically reported “stripe json error fix” | Checkout changed direct JSON parsing to text-first parsing with empty/non-JSON handling; guards remain | Check HTTP status/content type and `[checkout]` / `[api/checkout]` logs; establish server failure before assuming a JSON bug |
| `6782f21`, historically reported “stripe fix” | Admin initialization replaced project-only setup with explicit `cert()` credentials and missing-settings checks | Verify server credential names, matching project, private-key newline format; `verifyFirebaseToken` can mask initialization errors as unauthorized |
| `a32476d`, historically reported “sign in problem” | Header distinguished signed-out login/register links and signed-in Account; this was a navigation change, not proof Auth itself failed | Check Firebase Auth state and header loading separately; current header/drawer show Login, registration is linked on login page |
| `193e1b2`, historically reported “stripe and order details fix” | Removed local shipping-address payload in favor of Stripe collection; added adaptive pricing, currency-aware order display and timed refresh | Verify confirmed Stripe collected shipping/address/phone and stored currency/totals; do not restore the older form unintentionally |

Current code troubleshooting (not claims of past incidents):

- Empty shop/404: inspect Printify token/shop/visibility and upstream errors; several catalog catches show empty UI without surfacing cause. Check requested cache age and supported image hostname for image failures.
- Profile permission denied: compare deployed rules with `firestore.rules`; verify UID owner and allowed keys. `customerErrorMessage()` specifically points to publishing updated rules. No need to add client-writable roles.
- Checkout unavailable: check Firebase Admin, Stripe credentials/configuration, Printify availability/variant/price, tax settings, and server log prefix. Rejected cart returns 400/409; missing auth returns 401.
- Paid but no production: inspect `paymentStatus`, `status`, lease, attempt count, `fulfillmentLastError`, Printify ID/external ID and test-mode skip reason. A paid test session intentionally creates no production order. Account refresh can retry eligible live orders; verify existing external order before manual resubmission.
- Stale shipment: validate webhook URL/secret/topic/shop, signature and marker records; compare live Printify fetch. Printify webhook failures return 500 for retry; invalid signature 401; absent secret 503. Stripe invalid/missing signature returns 400.
- Review rejected for paid purchase: check exact stored `status` and 100-order query limit; current eligibility defect is described below.

## Limitations and unresolved details

Code-verified gaps; impact beyond the source is unverified:

- Reviews accept only `order.status === "paid"`; fulfillment normally changes it to `in_fulfillment` (test mode to `test_payment_paid`), so legitimate buyers can be blocked. Owner-created Firestore orders can also forge this eligibility because create rules do not validate payment facts. No moderation workflow or rate limit exists.
- `OrderTracker.statusLabel()` matches generic `/failed/` before `fulfillment_failed`, making the later retry label unreachable and displaying a payment-failure label for fulfillment failures.
- Webhook existence checks and marker writes are not atomic; lease only blocks concurrent acquisition while there is no Printify ID. No worker/scheduler retries independently; retries depend on webhook redelivery/success page/order reads. Printify lookup stops after 100 pages. Late/out-of-order events and concurrent fulfillment are not proven safe.
- Checkout session creation precedes Firestore persistence; partial failures can leave remote sessions without local orders. Reusing an idempotency key still merges pending fields/timestamps into the stored document. UI generates a new key per submission rather than retaining it across retries.
- Success page confirms arbitrary supplied Stripe session ID without ownership check; generic output avoids customer detail, but it can trigger fulfillment and clear the visiting browser's cart. Cart load/clear initialization timing is not integration-tested.
- Orders/reviews query an unordered subset of at most 100 documents then sort in memory; this does not guarantee latest 100. Printify refresh failure returns pending-shaped data without saved shipment/address details.
- Category/style/subcategory controls mostly jump to `#products`; they do not filter. “Popular” means upstream order, not measured popularity. Category page number is not clamped to last page. Home “Shop all” exposes only first eight featured products.
- Newsletter is a `mailto:` form targeting a placeholder local-domain mailbox, not a subscription service. Support/privacy addresses differ across account and policy copy. No address-book UI, automated privacy deletion/export, automated retention policy, or messaging consent enforcement exists.
- localStorage cart parse/storage failure has no user-facing recovery and parsed entries have no client schema validation. Cart is shared between accounts on a browser. Login `next` destination is used without an explicit internal-path allowlist.
- Remote catalog/analytics/auth/tax/webhook/deployment settings and live tests were not verified. No performance measurements, security audit, or policy/legal review was performed. A tracked `firebase-debug.log` exists; do not copy diagnostic contents into documentation or infer deployment success from it.

## Task-to-files and verification

| Task | Read/edit first | Appropriate verification after a behavior change |
| --- | --- | --- |
| Theme/navigation/branding | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/site-{header,footer}.tsx`, `public/images/` | Desktop/mobile layouts, menu dismissal/scroll restoration, keyboard navigation, logo/image fit |
| Catalog/category behavior | `src/lib/catalog/{categories,storefront}.ts`, `src/lib/printify/client.ts`, `src/app/page.tsx`, category/product pages | Visible/hidden products, unknown blueprints, availability, sorting/pagination, empty/error states, SEO consistency |
| Auth/profile/email actions | `src/components/{providers,auth-form,account-dashboard,firebase-action-handler}.tsx`, `src/lib/firebase/`, `firestore.rules` | Signed-out/loading/auth states, owner access, invalid/expired codes, profile save, rules against proposed fields |
| Cart/checkout/pricing | `src/components/{providers,add-to-cart,clear-paid-cart}.tsx`, cart/checkout pages, checkout route | Persistence, quantities, server rejection of invalid/unavailable items, threshold shipping, Stripe test payment/cancel/confirmation |
| Fulfillment/payment webhooks | `src/lib/orders/fulfillment.ts`, Stripe/Printify webhook routes, `src/lib/printify/client.ts` | Mock/test-mode payment checks, duplicate/failure/retry cases, signature rejection, no test-mode production; avoid real production costs |
| Order history/tracking | Both orders routes, `src/components/order-tracker.tsx` | Cross-user 404/401, settled totals/currency, live/fallback status, multiple shipments, polling and retry side effects |
| Reviews | Reviews route, `src/lib/reviews/server.ts`, `src/components/product-reviews.tsx`, product page, rules | Purchase eligibility across fulfillment states, ownership/update key, validation, public-only output, actual JSON-LD ratings |
| SEO/analytics/policies | `src/lib/seo.ts`, root/page metadata, sitemap/robots/llms routes, informational pages | Canonicals, actual generated structured data and crawl lists, noindex, analytics/consent behavior, policy/checkout agreement |
| Infrastructure/dependencies | `package.json`, lockfile, `.nvmrc`, config files, `.env.local.example`, webhook script | Supported Node/script execution, environment names, build/runtime separation; approve actual remote changes within task scope |

Preserve these invariants unless a task explicitly changes them: server credentials stay server-only; authorize UID ownership on Admin-backed customer APIs; verify raw webhook signatures before processing; validate server catalog prices/variants; do not submit production for unpaid/test-mode sessions; retain duplicate mitigation; do not clear unpaid carts; keep CAD minor units and settled currency/totals distinct; synchronize shipping thresholds/countries with policy/SEO copy; escape JSON-LD; preserve Next.js instructions and unrelated user changes.

For application changes, run lint/type/build checks appropriate to scope and focused manual or mocked flow checks; builds may need network and service configuration. No tests/builds/integration calls were run for this documentation-only task. Verification consisted of source/config/lockfile inspection, selected Git diffs, repository-path checks and documentation diff review.

## Maintaining this guide

Future agents must update this guide in the same change when architecture, routes, models, business rules, environment names, integrations, commands, or operational behavior changes. Reverify the affected source, revise the date/inspected commit, and remove obsolete statements or explicitly mark them historical. A commit hash records the inspected baseline, not necessarily the later documentation commit. Keep task references and known issues aligned with fixes; distinguish code evidence from reported symptoms and live verification. Never add secret values, credentials, customer records, or personal data. Keep `AGENTS.md` pointing here and retain existing documentation.
