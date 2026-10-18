import fs from "node:fs";

// Preserve existing Indonesian URLs. Only English pages receive an /en prefix.
const config = JSON.parse(fs.readFileSync("docs.json", "utf8"));
const idTabs = structuredClone(config.navigation.languages?.find(item => item.language === "id")?.tabs || config.navigation.tabs);
if (!idTabs) throw new Error("Existing Indonesian navigation is required");
const labels = {
  Panduan: "Guides", Mulai: "Get started", Komunikasi: "Communication",
  Operasional: "Operations", Integrasi: "Integrations", "Endpoint reference": "Endpoint reference",
};
function english(node) {
  if (Array.isArray(node)) return node.map(english);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(Object.entries(node).map(([key, value]) => {
    if (key === "pages") return [key, value.map(page => typeof page === "string" ? "en/" + page : english(page))];
    if (key === "tab" || key === "group") return [key, labels[value] || value];
    if (key === "openapi") return [key, {source:"/openapi.json", directory:"en/api-reference"}];
    return [key, english(value)];
  }));
}
for (const tab of idTabs) for (const group of tab.groups || []) if (group.openapi) {
  group.openapi = {source:"/openapi-id.json",directory:"api-reference"};
  group.group = "Referensi endpoint";
}
const enTabs = english(idTabs);
for (const tab of enTabs) for (const group of tab.groups || []) if (group.openapi) group.group = "Endpoint reference";
const navbar = label => ({links:[{label:label === "Open DekaSign" ? "Support" : "Dukungan", href:"mailto:halo@dekasign.com"}],primary:{type:"button",label,href:"https://dekasign.com/login"}});
config.navigation = {languages:[
  {language:"id",default:true,navbar:navbar("Buka DekaSign"),tabs:idTabs},
  {language:"en",navbar:navbar("Open DekaSign"),tabs:enTabs},
]};
fs.writeFileSync("docs.json",JSON.stringify(config,null,2)+"\n");
console.log("Configured native Indonesian/English navigation; original Indonesian URLs preserved.");
