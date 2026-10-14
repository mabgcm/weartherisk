// Verify the rendered HTML for every product in the read-only catalog audit report.
import fs from 'node:fs';
const origin = process.argv[2] || 'http://127.0.0.1:3002';
const audit = JSON.parse(fs.readFileSync('/tmp/weartherisk-product-seo-audit.json', 'utf8'));
const decode = (text) => text.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const results = [];
for (let i = 0; i < audit.results.length; i += 4) {
  const batch = await Promise.all(audit.results.slice(i,i+4).map(async product => {
    const response = await fetch(`${origin}/products/${product.id}`, {headers:{'User-Agent':'Googlebot'}});
    const html = await response.text(); const issues = [];
    if (response.status !== 200) issues.push(`HTTP ${response.status}`);
    const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(m=>decode(m[1]));
    if (titles.length!==1 || titles[0]!==product.title) issues.push('Missing, duplicate, or incorrect title');
    const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map(m=>decode(m[1]));
    if (canonicals.length!==1 || canonicals[0]!==product.canonical) issues.push('Missing, duplicate, or incorrect canonical');
    if ((html.match(/<h1\b/g)||[]).length!==1) issues.push('Expected exactly one H1');
    if (!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/.test(html)) issues.push('Missing description');
    if (!/<meta\b[^>]*property="og:image"[^>]*content="https:/.test(html)) issues.push('Missing social product image');
    const nodes=[];
    for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try {const parsed=JSON.parse(match[1]);nodes.push(...(Array.isArray(parsed)?parsed:parsed['@graph']||[parsed]));}
      catch {issues.push('Invalid JSON-LD');}
    }
    const entity=nodes.find(node=>node['@type']==='Product'||node['@type']==='ProductGroup');
    if(!entity || entity['@type']!==product.schema) issues.push('Missing or incorrect Product/ProductGroup');
    const offers=entity?.hasVariant ? entity.hasVariant.map(v=>v.offers) : Array.isArray(entity?.offers)?entity.offers:entity?.offers?[entity.offers]:[];
    if(offers.length!==product.variants) issues.push('Variant count does not match catalog');
    for(const offer of offers){
      if(!(Number(offer.price)>0)||offer.priceCurrency!=='CAD')issues.push('Invalid offer price/currency');
      if(!offer.url?.startsWith(product.canonical+'?variant='))issues.push('Incorrect variant URL');
      for(const reference of [...(offer.shippingDetails||[]),offer.hasMerchantReturnPolicy])if(reference?.['@id']&&!nodes.some(node=>node['@id']===reference['@id']))issues.push('Unresolved shipping/return reference');
    }
    return {id:product.id,status:response.status,issues:[...new Set(issues)]};
  }));
  results.push(...batch);
}
const response=await fetch(origin+'/sitemap.xml');const sitemap=await response.text();
const sitemapIssues=[];
if(response.status!==200)sitemapIssues.push('Sitemap HTTP '+response.status);
for(const product of audit.results)if(!sitemap.includes(`<loc>${product.canonical}</loc>`))sitemapIssues.push('Missing product '+product.id);
const report={products:results.length,productsWithIssues:results.filter(r=>r.issues.length).length,sitemapIssues,results};
fs.writeFileSync('/tmp/weartherisk-rendered-seo-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(`Rendered HTML: ${report.products} products; ${report.productsWithIssues} with issues; ${sitemapIssues.length} sitemap issues.`);
for(const product of results.filter(r=>r.issues.length))console.log(product.id+': '+product.issues.join('; '));
console.log('Report: /tmp/weartherisk-rendered-seo-audit.json');
if(report.productsWithIssues||sitemapIssues.length)process.exitCode=1;
