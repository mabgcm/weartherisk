// Bulk-imports product reviews from a CSV into Firestore `productReviews`.
// Usage:
//   node scripts/import-reviews.mjs <reviews.csv> [--dry-run]
// The CSV needs headers: productId, rating, title, body, authorName,
// verifiedPurchase, date (the "Wear The Risk - Urun Yorumlari" sheet export works).
// Firebase Admin credentials come from FIREBASE_PROJECT_ID (or
// NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL and
// FIREBASE_PRIVATE_KEY, read from the environment or the repo .env.local.
// Doc IDs are `{productId}_import_{row}` so re-running updates instead of
// duplicating. Blank rows (no title/body) are skipped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

// Minimal CSV parser: handles quoted fields, embedded commas and "" escapes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (char !== "\r") field += char;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function normalizeHeader(header) {
  return header.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z]/g, "");
}

function parseDate(value) {
  const match = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(value ?? "");
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return Number.isNaN(date.getTime()) ? null : admin.firestore.Timestamp.fromDate(date);
}

async function main() {
  const [, , csvPath, flag] = process.argv;
  const dryRun = flag === "--dry-run" || process.argv.includes("--dry-run");
  if (!csvPath) {
    console.error("Usage: node scripts/import-reviews.mjs <reviews.csv> [--dry-run]");
    process.exit(1);
  }
  loadEnvFile();
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const headers = rows[0].map(normalizeHeader);
  const indexOf = (name) => headers.indexOf(name);
  const required = ["productid", "rating", "title", "body", "authorname"];
  for (const name of required) {
    if (indexOf(name) === -1) { console.error(`CSV is missing a "${name}" column.`); process.exit(1); }
  }

  const valid = [];
  const errors = [];
  let rowNumber = 0;
  for (const cells of rows.slice(1)) {
    rowNumber++;
    const get = (name) => (cells[indexOf(name)] ?? "").trim();
    const title = get("title");
    const body = get("body");
    if (!title && !body) continue; // blank row: skip silently
    const productId = get("productid");
    const rating = Number(get("rating"));
    const authorName = get("authorname");
    const verifiedRaw = (get("verifiedpurchase") || "false").toLowerCase();
    const verifiedPurchase = ["true", "1", "yes"].includes(verifiedRaw);
    const stamp = parseDate(get("date")) ?? admin.firestore.Timestamp.now();
    const problems = [];
    if (!productId) problems.push("missing productId");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) problems.push(`bad rating "${get("rating")}"`);
    if (title.length < 3) problems.push("title too short");
    if (body.length < 10) problems.push("body too short");
    if (!authorName) problems.push("missing authorName");
    if (problems.length) { errors.push(`row ${rowNumber + 1}: ${problems.join("; ")}`); continue; }
    valid.push({
      id: `${productId}_import_${rowNumber}`,
      data: {
        productId,
        rating,
        title: title.slice(0, 100),
        body: body.slice(0, 2000),
        authorName: authorName.slice(0, 80),
        verifiedPurchase,
        status: "published",
        importSource: "csv",
        createdAt: stamp,
        updatedAt: stamp,
      },
    });
  }

  console.log(`Rows: ${rows.length - 1} | valid: ${valid.length} | errors: ${errors.length}`);
  for (const error of errors.slice(0, 20)) console.log("  !", error);
  if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
  if (!valid.length) { console.error("Nothing to import."); process.exit(1); }

  const perProduct = new Map();
  for (const review of valid) perProduct.set(review.data.productId, (perProduct.get(review.data.productId) ?? 0) + 1);
  console.log(`Products touched: ${perProduct.size}`);

  if (dryRun) {
    console.log("Dry run: no writes performed. Sample:");
    for (const review of valid.slice(0, 5)) {
      console.log(`  ${review.id} | ${review.data.rating}* | ${review.data.title} | ${review.data.authorName}`);
    }
    return;
  }

  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }), projectId });
  const db = admin.firestore();
  const collection = db.collection("productReviews");
  let written = 0;
  for (let i = 0; i < valid.length; i += 450) {
    const batch = db.batch();
    for (const review of valid.slice(i, i + 450)) batch.set(collection.doc(review.id), review.data, { merge: true });
    await batch.commit();
    written += Math.min(450, valid.length - i);
    console.log(`  wrote ${written}/${valid.length}`);
  }
  console.log(`Done: ${written} reviews published.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
