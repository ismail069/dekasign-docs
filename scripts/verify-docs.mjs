import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const config=JSON.parse(fs.readFileSync("docs.json","utf8"));
const spec=JSON.parse(fs.readFileSync("openapi.json","utf8"));
const pages=[];
function walk(node) { if(Array.isArray(node)) return node.forEach(walk); if(!node||typeof node!=="object")return; for(const [key,value] of Object.entries(node)) { if(key==="pages")pages.push(...value.filter(v=>typeof v==="string")); walk(value); }}
walk(config.navigation);
assert.equal(new Set(pages).size,pages.length);
for(const page of pages) {
 const text=fs.readFileSync(page+".mdx","utf8");
 assert.match(text,/^---\r?\n(?:.|\r|\n)*?title:/);
 assert.match(text,/description:/);
 assert.doesNotMatch(text,/Mintlify Starter Kit|support@mintlify|CV DNA Konsultan/);
 for(const match of text.matchAll(/(?:href=\{|href=)?["(](\/[^"#?)\s}]+)(?:[#?][^"\s)]*)?["\)]/g)) {
  const target=match[1];
  if(target==="/openapi.json")continue;
  assert.ok(fs.existsSync("."+target+".mdx")||fs.existsSync("."+target),"Missing link "+page+" -> "+target);
 }
}
const app=path.resolve(process.env.DEKASIGN_APP_SOURCE||"../dekasign-app");
const actual=[];
function routes(dir) {for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {const file=path.join(dir,entry.name); if(entry.isDirectory())routes(file); else if(entry.name==="route.ts"){const source=fs.readFileSync(file,"utf8");const route="/api/v1/"+path.relative(path.join(app,"src/app/api/v1"),path.dirname(file)).replaceAll("\\","/").replace(/\[([^\]]+)\]/g,"{$1}");for(const method of ["GET","POST","PATCH","DELETE","PUT"])if(new RegExp("export (?:async )?function "+method+"\\b|\\bas "+method+"\\b|export \\{\\s*"+method+"\\s*\\}").test(source))actual.push(method+" "+route);}}}
routes(path.join(app,"src/app/api/v1"));
const documented=Object.entries(spec.paths).flatMap(([route,ops])=>Object.keys(ops).map(method=>method.toUpperCase()+" "+route));
assert.deepEqual(documented.sort(),actual.sort(),"OpenAPI must cover only actual methods, including session and retired routes");
for(const file of [config.favicon,config.logo.light,config.logo.dark])assert.ok(fs.existsSync("."+file),"Missing brand asset");
assert.equal(config.api.playground.display,"none","Do not encourage browser entry of secrets");
console.log("PASS: "+pages.length+" navigation pages, local links, branding and "+actual.length+" source-matched API operations.");
