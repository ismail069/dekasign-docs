import fs from "node:fs";
import assert from "node:assert/strict";
const base=process.env.DOCS_BASE_URL || "https://docs.dekasign.com";
const config=JSON.parse(fs.readFileSync("docs.json","utf8"));
const results=[];
for (const language of config.navigation.languages) {
 const pages=[];
 const walk=node=>{if(Array.isArray(node))return node.forEach(walk);if(!node||typeof node!=="object")return;for(const [key,value]of Object.entries(node)){if(key==="pages")pages.push(...value.filter(item=>typeof item==="string"));walk(value);}};
 walk(language);
 for(const page of pages) {
  const pathname=page==="index"?"/":"/"+page.replace(/\/index$/,"");
  const response=await fetch(base+pathname,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,pathname);
  assert.equal(response.headers.get("x-dekasign-docs-isolation"),"v1",pathname+" must remain behind isolation proxy");
  assert.equal(response.headers.has("set-cookie"),false,pathname+" must not set parent-domain cookies");
  const html=await response.text();
  const title=/^title:\s*"(.+)"/m.exec(fs.readFileSync(page+".mdx","utf8"))[1];
  const escaped=title.replaceAll("&","&amp;");
  assert.ok(html.includes(title)||html.includes(escaped),pathname+" translated title");
  // Mintlify's current SSR shell declares lang=en even for native ID pages;
  // language routing/SEO alternates are rendered independently. Inspect the
  // hydrated document language separately in browser QA, not a false SSR pass.
  assert.ok(html.includes('hreflang="'+language.language+'"'),pathname+" correct alternate language");
  assert.ok(html.includes("/images/logo-dekasign.png") || html.includes("logo-dekasign.png"),pathname+" supplied logo");
  results.push({language:language.language,path:pathname,status:response.status});
 }
}
console.log("PASS live locales: "+results.length+" ID/EN pages, localized titles/hreflang, supplied logo and credential-isolation marker. SSR html-lang limitation is not marked passed.");
