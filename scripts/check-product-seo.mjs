// Checks the actual SEO builders. --live audits every visible Printify shop product (read-only).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const nodeRequire = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (modules.has(filename)) return modules.get(filename);
  const record = { exports: {} };
  modules.set(filename, record.exports);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module: record, exports: record.exports, process, URL, console, require: (name) => {
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
    return nodeRequire(name);
  } }, { filename });
  return record.exports;
}
const seo = load('src/lib/catalog/product-seo.ts');
const base = load('src/lib/seo.ts');
const fixture = {
  id: 'test-shirt', title: 'Original &amp; Bold T-Shirt | Made to order', description: '<p>Soft cotton &#8212; original artwork.</p><script>bad()</script>', visible: true,
  images: [{src:'https://images.printify.com/default.png',is_default:true,variant_ids:[1]}, {src:'https://images.printify.com/blue.png',is_default:false,variant_ids:[2]}],
  options: [{type:'color',name:'Color',values:[{id:10,title:'Black'},{id:20,title:'Blue'}]}],
  variants: [
    {id:1,sku:'BLACK',title:'Black',price:2499,is_enabled:true,is_available:true,options:[10]},
    {id:2,sku:'BLUE',title:'Blue',price:7999,is_enabled:true,is_available:false,options:[20]},
    {id:3,sku:'INVALID',title:'Invalid',price:-1,is_enabled:true,is_available:true},
    {id:4,sku:'DISABLED',title:'Disabled',price:100,is_enabled:false,is_available:true},
  ],
};
assert.equal(base.plainText(fixture.description), 'Soft cotton — original artwork.');
assert.equal(base.plainText('&#x110000; &#55296;'), '');
assert(!base.safeJsonLd({text:'</script>'}).includes('</script>'));
const metadata = seo.productMetadata(fixture);
assert.equal(metadata.alternates.canonical, base.absoluteUrl('/products/test-shirt'));
assert(metadata.title.absolute.endsWith('| Wear The Risk'));
assert(metadata.description.length <= 160);
const nodes = seo.productStructuredData(fixture);
const [group] = nodes;
assert.equal(group['@type'], 'ProductGroup');
assert.equal(group.hasVariant.length, 2);
assert.equal(group.hasVariant[1].color, 'Blue');
assert.equal(group.hasVariant[1].image[0], 'https://images.printify.com/blue.png');
assert.equal(group.hasVariant[0].offers.availability, 'https://schema.org/InStock');
assert.equal(group.hasVariant[1].offers.availability, 'https://schema.org/OutOfStock');
assert.equal(group.hasVariant[0].offers.price, '24.99');
assert.equal(nodes.find(node => node["@id"] === group.hasVariant[1].offers.shippingDetails[0]["@id"]).shippingRate.value, 0);
assert.equal(nodes.find(node => node["@id"] === group.hasVariant[0].offers.shippingDetails[0]["@id"]).shippingRate.value, 7.99);
assert(!('aggregateRating' in group));
assert(!('gtin' in group.hasVariant[0]));
const [unrated] = seo.productStructuredData(fixture, undefined, [{rating:6,title:'bad',body:'bad',authorName:'bad'}]);
assert(!('aggregateRating' in unrated));
const [single] = seo.productStructuredData({...fixture,options:undefined,variants:[fixture.variants[0]]});
assert.equal(single['@type'], 'Product');
assert.equal(seo.productImages({...fixture,images:[...fixture.images,fixture.images[0]]}).length,2);
console.log('SEO regression checks passed: entities, JSON-LD escaping, canonical, metadata, variants, stock, prices, images, shipping, and no invented ratings/GTINs.');

async function liveAudit() {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shop = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shop) throw new Error('Printify environment configuration is required.');
  const products = []; let largestPageBytes = 0;
  for (let page = 1; ; page++) {
    const response = await fetch(`https://api.printify.com/v1/shops/${encodeURIComponent(shop)}/products.json?limit=10&page=${page}`, { headers: {Authorization:`Bearer ${token}`, 'User-Agent':'WearTheRisk-SEO-Audit/1.0'} });
    if (!response.ok) throw new Error(`Catalog request failed: HTTP ${response.status}`);
    const body = await response.text();
    largestPageBytes = Math.max(largestPageBytes, Buffer.byteLength(body));
    const payload = JSON.parse(body);
    products.push(...payload.data.filter(p => p.visible));
    if (page >= payload.last_page) break;
  }
  const seenTitles = new Map(); const seenDescriptions = new Map();
  const results = products.map(product => {
    const metadata = seo.productMetadata(product);
    const [schema] = seo.productStructuredData(product);
    const issues = [];
    if (!product.title.trim()) issues.push('Missing product title');
    if (!base.plainText(product.description)) issues.push('Missing source description');
    if (!seo.productImages(product).length) issues.push('Missing product images');
    if (!seo.productVariants(product).length) issues.push('No enabled, valid-price variants');
    if (seenTitles.has(metadata.title.absolute)) issues.push('Duplicate SEO title with '+seenTitles.get(metadata.title.absolute));
    if (seenDescriptions.has(metadata.description)) issues.push('Duplicate meta description with '+seenDescriptions.get(metadata.description));
    seenTitles.set(metadata.title.absolute,product.id); seenDescriptions.set(metadata.description,product.id);
    return {id:product.id,title:metadata.title.absolute,canonical:metadata.alternates.canonical,schema:schema['@type'],variants:seo.productVariants(product).length,issues};
  });
  const report = {canonicalOrigin:base.SITE_URL,largestPageBytes,products:results.length,productsWithIssues:results.filter(p=>p.issues.length).length,results};
  fs.writeFileSync('/tmp/weartherisk-product-seo-audit.json',JSON.stringify(report,null,2)+'\n');
  console.log(`Audited ${report.products} visible products; ${report.productsWithIssues} with source/content issues. Report: /tmp/weartherisk-product-seo-audit.json`);
  console.log(`Largest catalog page: ${largestPageBytes} bytes (Next.js cache limit: 2 MB).`);
  for (const item of results.filter(p=>p.issues.length)) console.log(item.id+': '+item.issues.join('; '));
  if (report.productsWithIssues) process.exitCode = 1;
}
if (process.argv.includes('--live')) liveAudit().catch(error => { console.error(error.message); process.exitCode = 1; });
