import fs from "node:fs";

// Translate explanatory prose only. Technical action labels, operation IDs,
// paths, field names, enum values, examples and schema constraints stay stable.
const source = JSON.parse(fs.readFileSync("openapi.json", "utf8"));
const translations = {
  "DekaSign sandbox and session API":"API sandbox dan sesi DekaSign",
  "Management endpoints are sandbox-only and may return SANDBOX_API_DISABLED on production hosts. Template authoring and human approval decisions are not machine-key APIs. Session routes are separately authenticated. Responses are intentionally extensible; narrative guides document key fields. This specification does not grant access or enable feature flags.":"Endpoint manajemen hanya untuk sandbox dan dapat mengembalikan SANDBOX_API_DISABLED pada host produksi. Desain template dan keputusan manusia bukan API machine-key. Rute sesi memakai autentikasi terpisah. Respons dapat diperluas; panduan menjelaskan field penting. Spesifikasi ini tidak memberikan akses atau mengaktifkan fitur.",
  "Use the authorized sandbox workspace supplied by your administrator.":"Gunakan workspace sandbox berwenang yang diberikan administrator.",
  "Operation result. Read fields vary by endpoint and deployment; see narrative guide.":"Hasil operasi. Field respons berbeda menurut endpoint dan deployment; lihat panduan.",
  "Invalid operation or layout.":"Operasi atau layout tidak valid.",
  "Invalid or expired credential/session.":"Kredensial/sesi tidak valid atau kedaluwarsa.",
  "Scope, environment, tenant or authority denied.":"Scope, environment, tenant atau kewenangan ditolak.",
  "Not found or outside app scope.":"Tidak ditemukan atau di luar lingkup aplikasi.",
  "Stale version, active usage or idempotency conflict.":"Versi kedaluwarsa, masih digunakan aktif atau konflik idempotensi.",
  "Invalid schema or required idempotency key.":"Schema atau idempotency key wajib tidak valid.",
  "Rate limited.":"Batas laju permintaan tercapai.",
  "Sandbox disabled or operation temporarily unavailable.":"Sandbox tidak aktif atau operasi sementara tidak tersedia.",
  "Workspace-scoped identifier.":"Identitas dalam lingkup workspace.",
  "Private PDF bytes.":"Data berkas PDF privat.",
  "Required scope documents:write. One PDF, maximum 30 MB and 1–200 pages. Sandbox only.":"Memerlukan scope documents:write. Tepat satu PDF, maksimum 30 MB dan 1–200 halaman. Hanya sandbox.",
  "Secret frozen receipt; valid for 10 minutes. Do not log.":"Receipt rahasia yang dibekukan; berlaku 10 menit. Jangan dicatat ke log.",
  "Not an integration-key endpoint. Requires the dedicated session/identity flow described in the guide.":"Bukan endpoint integration-key. Memerlukan alur sesi/identitas khusus sesuai panduan.",
  "Opaque secret session credential; do not log.":"Kredensial sesi opaque yang rahasia; jangan dicatat ke log.",
  "Opaque session credential in path. Idempotency-Key header or body idempotencyKey is required by command execution. Layout follows the server document layout schema; bearer app key is not accepted as this session.":"Path memuat kredensial sesi opaque. Eksekusi command memerlukan header Idempotency-Key atau body idempotencyKey. Layout mengikuti schema dokumen server; Bearer app key bukan pengganti sesi ini.",
  "ENDPOINT_RETIRED; use /approval-requests.":"ENDPOINT_RETIRED; gunakan /approval-requests.",
  "Sandbox dks_test_ key, server-side only.":"Key sandbox dks_test_, hanya untuk server.",
};
function translated(value) {
  if (translations[value]) return translations[value];
  const scope = /^Required scope: ([\w:]+)\. Sandbox only; app allowlists and requester authority also apply\.$/.exec(value);
  if (scope) return `Memerlukan scope ${scope[1]}. Hanya sandbox; allowlist aplikasi dan kewenangan pemohon juga diperiksa.`;
  throw new Error("Unreviewed API description: " + value);
}
function localize(node) {
  if (Array.isArray(node)) return node.map(localize);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(Object.entries(node).map(([key,value]) => [key,
    ((key === "description" || key === "title") && typeof value === "string") ? translated(value) : localize(value)
  ]));
}
fs.writeFileSync("openapi-id.json",JSON.stringify(localize(source),null,2)+"\n");
console.log("Localized Indonesian API explanations without changing the technical contract or existing action URLs.");
