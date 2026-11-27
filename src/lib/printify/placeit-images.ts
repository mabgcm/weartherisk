/**
 * Placeit model mockups (apparel): product id -> the variant ids the mockup
 * depicts. Files are hosted on Vercel Blob at
 * <PLACEIT_BLOB_BASE>/<productId>-main.webp.
 *
 * Storefront rule (Matt, 2026-11-27): main product images come from Placeit.
 * Printify does not accept external gallery images, so these are prepended
 * ahead of the Printify mockups in client.ts — cards and the product gallery
 * lead with the Placeit shot while the Printify mockups stay behind it.
 */
export const PLACEIT_BLOB_BASE = "https://8ldzqw5nhl4tvlis.public.blob.vercel-storage.com/placeit";

export const PLACEIT_MAIN_IMAGES: Record<string, number[]> = {
  // "You Can't Scare Me I Have a Crazy Daughter" tee: first mockup (senior
  // model, Placeit 28419) was pulled on Matt's order 2026-11-27 — model read
  // as "grandpa", he wants a younger dad look. New entry lands here only
  // after Matt approves the mockup.
};
