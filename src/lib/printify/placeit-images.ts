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
  // "You Can't Scare Me I Have a Crazy Daughter" tee — black shirt, white
  // print, senior-man model (Placeit template 28419). Black variant ids:
  // S 12126, M 12125, L 12124, XL 12127, 2XL 12128.
  "6b098d354b818ea3e20f5f9e": [12124, 12125, 12126, 12127, 12128],
};
