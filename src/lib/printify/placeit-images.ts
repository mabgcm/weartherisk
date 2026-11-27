/**
 * Placeit model mockups (apparel): product id -> the hosted file and the
 * variant ids the mockup depicts. Files live on Vercel Blob under
 * <PLACEIT_BLOB_BASE>/<file>.
 *
 * Storefront rule (Matt, 2026-11-27): main product images come from Placeit,
 * and every mockup is shown to Matt for approval before it goes live.
 * Printify does not accept external gallery images, so these are prepended
 * ahead of the Printify mockups in client.ts — cards and the product gallery
 * lead with the Placeit shot while the Printify mockups stay behind it.
 *
 * Dad Stuff model pool (Matt, 2026-11-27 — rotate among these Placeit
 * templates for Dad Stuff products): a15931 "Against the Sun" (~50),
 * a16976 "Graffiti Wall" (~40-45), a16000 "Light Blue Wall" (~35-40),
 * 20782 "Brick Wall" (~45-50). Dad look only — never a grandpa/senior,
 * never a young man, never a woman.
 */
export const PLACEIT_BLOB_BASE = "https://8ldzqw5nhl4tvlis.public.blob.vercel-storage.com/placeit";

export interface PlaceitMainImage {
  file: string;
  variantIds: number[];
}

export const PLACEIT_MAIN_IMAGES: Record<string, PlaceitMainImage> = {
  // "You Can't Scare Me I Have a Crazy Daughter" tee — black shirt, white
  // print, dad model (Placeit template a15931). Approved by Matt 2026-11-27.
  // Black variant ids: S 12126, M 12125, L 12124, XL 12127, 2XL 12128.
  "6b098d354b818ea3e20f5f9e": {
    file: "6b098d354b818ea3e20f5f9e-main2.webp",
    variantIds: [12124, 12125, 12126, 12127, 12128],
  },
};
