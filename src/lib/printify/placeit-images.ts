/**
 * Placeit model mockups (apparel): product id -> the hosted file name.
 * Files live on Vercel Blob under <PLACEIT_BLOB_BASE>/<file>.
 *
 * Storefront rule (Matt, 2026-11-27): main product images come from Placeit,
 * and every mockup is shown to Matt for approval before it goes live.
 * Printify does not accept external gallery images, so in client.ts the
 * Placeit shot is prepended ahead of the Printify mockups and tagged with
 * every enabled variant id — that makes it the lead image on cards and on
 * the product page no matter which variant the page opens with, while the
 * Printify mockups stay in the gallery behind it.
 *
 * Dad Stuff model pool (Matt, 2026-11-27 — rotate among these Placeit
 * templates for Dad Stuff products): a15931 "Against the Sun" (~50),
 * a16976 "Graffiti Wall" (~40-45), a16000 "Light Blue Wall" (~35-40),
 * 20782 "Brick Wall" (~45-50). Dad look only — never a grandpa/senior,
 * never a young man, never a woman.
 */
export const PLACEIT_BLOB_BASE = "https://8ldzqw5nhl4tvlis.public.blob.vercel-storage.com/placeit";

export const PLACEIT_MAIN_IMAGES: Record<string, string> = {
  // "You Can't Scare Me I Have a Crazy Daughter" tee — black shirt, white
  // print, dad model (Placeit template a15931). Approved by Matt 2026-11-27.
  "6b098d354b818ea3e20f5f9e": "6b098d354b818ea3e20f5f9e-main2.webp",
};
