import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const config=JSON.parse(fs.readFileSync("docs.json","utf8"));
const spec=JSON.parse(fs.readFileSync("openapi.json","utf8"));
const pages=[];
function walk(node) { if(Array.isArray(node)) return node.forEach(walk); if(!node||typeof node!=="object")return; for(const [key,value] of Object.entries(node)) { if(key==="pages")pages.push(...value.filter(v=>typeof v==="string")); walk(value); }}
walk(config.navigation);
assert.equal(new Set(pages).size,pages.length);
const languages=config.navigation.languages;
assert.deepEqual(languages.map(item=>item.language),["id","en"]);
assert.equal(languages[0].default,true);
const localePages = language => {
 const found=[];
 function visit(node) {if(Array.isArray(node))return node.forEach(visit);if(!node||typeof node!=="object")return;for(const [key,value]of Object.entries(node)){if(key==="pages")found.push(...value.filter(item=>typeof item==="string"));visit(value);}}
 visit(language);return found;
};
const idPages=localePages(languages[0]),enPages=localePages(languages[1]);
const requiredPages = [
 "index", "quickstart",
 ...["owner-setup", "accounts-and-roles", "settings", "availability", "organization-hierarchy", "access-profiles", "owner-reports", "notification-channels", "email-studio", "categories-and-forms", "form-builder", "table-csv", "approval-workflows", "request-form-templates", "sandbox", "requests-and-revisions", "delegation", "workflow-signing", "document-sign", "my-signature", "verify-document", "document-data", "secure-sharing", "operation-tasks", "my-projects", "operations"].map(name => "guides/" + name),
 ...["overview", "authentication", "catalogs", "requests", "documents", "signing", "hosted-editor", "errors"].map(name => "api-reference/" + name),
 "integrations/outgoing-webhooks",
];
for (const required of requiredPages) assert.ok(idPages.includes(required), "Required guide missing from navigation: " + required);
assert.ok(idPages.every(page => !page.startsWith("en/")), "Indonesian navigation must use root-locale pages");
assert.deepEqual(enPages,idPages.map(page=>"en/"+page),"Every Indonesian guide needs an English counterpart");
assert.equal(languages[0].navbar.primary.label,"Buka DekaSign");
assert.equal(languages[1].navbar.primary.label,"Open DekaSign");
assert.deepEqual(languages[0].tabs[1].groups.find(group=>group.openapi).openapi,{source:"/openapi-id.json",directory:"api-reference"});
assert.deepEqual(languages[1].tabs[1].groups.find(group=>group.openapi).openapi,{source:"/openapi.json",directory:"en/api-reference"});
for(const page of pages) {
 const text=fs.readFileSync(page+".mdx","utf8");
 assert.match(text,/^---\r?\n(?:.|\r|\n)*?title:/);
 assert.match(text,/description:/);
 assert.doesNotMatch(text,/Mintlify Starter Kit|support@mintlify|CV DNA Konsultan/);
 for(const match of text.matchAll(/(?:href=\{|href=)?["(](\/[^"#?)\s}]+)(?:[#?][^"\s)]*)?["\)]/g)) {
  const target=match[1];
  if(target==="/openapi.json"||target==="/openapi-id.json")continue;
  if(page.startsWith("en/") && /^(?:\/guides\/|\/api-reference\/|\/integrations\/|\/quickstart$)/.test(target)) assert.fail("English guide links back to Indonesian: "+page+" -> "+target);
  assert.ok(fs.existsSync("."+target+".mdx")||fs.existsSync("."+target),"Missing link "+page+" -> "+target);
 }
}
function contract(node) {
 if(Array.isArray(node))return node.map(contract);
 if(!node||typeof node!=="object")return node;
 return Object.fromEntries(Object.entries(node).filter(([key,value])=>!(["description","title"].includes(key)&&typeof value==="string")).map(([key,value])=>[key,contract(value)]));
}
const idSpec=JSON.parse(fs.readFileSync("openapi-id.json","utf8"));
assert.deepEqual(contract(idSpec),contract(spec),"Locale explanations must not change the API contract or stable summaries/URLs");
assert.match(idSpec.info.description,/hanya untuk sandbox/);
assert.match(fs.readFileSync("en/guides/availability.mdx","utf8"),/Management REST APIs remain sandbox-only/);
assert.match(fs.readFileSync("en/guides/document-sign.mdx","utf8"),/3 days/);
assert.match(fs.readFileSync("en/guides/form-builder.mdx","utf8"),/10 columns/);
const app=path.resolve(process.env.DEKASIGN_APP_SOURCE||"../dekasign-app");
// Keep published upload limits tied to the shared UI/server policy. Route
// parity alone cannot detect a stale size or session-slot promise in prose.
const limits=fs.readFileSync(path.join(app,"src/lib/upload-limits.ts"),"utf8");
const limit = name => {
 const match=limits.match(new RegExp("export const "+name+" = (\\d+)(?: \\* 1024 \\* 1024)?;"));
 assert.ok(match,"Review changed upload policy expression: "+name);
 return Number(match[1]);
};
const signingMB=limit("DOCUMENT_SIGN_MAX_BYTES");
assert.match(spec.paths["/api/v1/documents"].post.description,new RegExp("maximum "+signingMB+" MB"),"API upload limit must match Document Sign");
for(const prefix of ["","en/"]) {
 const sharing=fs.readFileSync(prefix+"guides/secure-sharing.mdx","utf8");
 assert.match(sharing,new RegExp("\\*\\*"+limit("SHARING_MAX_SLOTS")+" (?:active file slots|slot file aktif)\\*\\*"));
 for(const name of ["SHARING_FILE_MAX_BYTES","SHARING_ZIP_MAX_BYTES"])assert.ok(sharing.includes("**"+limit(name)+" MB**"),"Sharing guide differs from upload policy: "+prefix+name);
 assert.match(fs.readFileSync(prefix+"api-reference/documents.mdx","utf8"),new RegExp(signingMB+" MB"));
}
const actual=[];
function routes(dir) {for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {const file=path.join(dir,entry.name); if(entry.isDirectory())routes(file); else if(entry.name==="route.ts"){const source=fs.readFileSync(file,"utf8");const route="/api/v1/"+path.relative(path.join(app,"src/app/api/v1"),path.dirname(file)).replaceAll("\\","/").replace(/\[([^\]]+)\]/g,"{$1}");for(const method of ["GET","POST","PATCH","DELETE","PUT"])if(new RegExp("export (?:async )?function "+method+"\\b|\\bas "+method+"\\b|export \\{\\s*"+method+"\\s*\\}").test(source))actual.push(method+" "+route);}}}
routes(path.join(app,"src/app/api/v1"));
const documented=Object.entries(spec.paths).flatMap(([route,ops])=>Object.keys(ops).map(method=>method.toUpperCase()+" "+route));
assert.deepEqual(documented.sort(),actual.sort(),"OpenAPI must cover only actual methods, including session and retired routes");
for(const file of [config.favicon,config.logo.light,config.logo.dark])assert.ok(fs.existsSync("."+file),"Missing brand asset");
for(const [file,expected] of Object.entries({
 "images/logo-dekasign.png":"c335565cfb02de630a94ccfe23c8cd350b548414cec90ebf98d9cd1284f8e93d",
 "images/favicon-dekasign.png":"9e8cb7fdc1b3bd901f997ef20e37cdfbfa609e49ed19ba99bef61da6277aadb5",
})) assert.equal(createHash("sha256").update(fs.readFileSync(file)).digest("hex"),expected,"Use the supplied original brand asset: "+file);
assert.equal(config.api.playground.display,"none","Do not encourage browser entry of secrets");
console.log("PASS: "+pages.length+" authored ID/EN navigation pages ("+idPages.length+" pairs), language-local links, shared upload limits, original branding and "+actual.length+" source-matched API operations with identical localized contracts.");
