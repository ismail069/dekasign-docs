import fs from "node:fs";
import path from "node:path";

// Reviewed contract, not a promise that sandbox admission is enabled on a host.
const s = (extra = {}) => ({ type: "string", ...extra });
const object = (properties, required = []) => ({type:"object",properties,...(required.length?{required}:{}),additionalProperties:false});
const freeObject = {type:"object",additionalProperties:true};
const reason = object({reason:s({minLength:5,maxLength:500})},["reason"]);
const doc = object({document_id:s(),field_key:s(),name:s(),sign_actor_ids:{type:"array",items:s(),maxItems:20}},["document_id","field_key","name"]);
const documents = {type:"array",items:doc,maxItems:20};
const json = schema => ({required:true,content:{"application/json":{schema}}});
const sender = {type:"object",additionalProperties:{oneOf:[s({maxLength:4000}),{type:"number"},{type:"boolean"}]}};
const preview = object({template_id:s(),expires_in_days:{type:"integer",minimum:1,maximum:365},sender_values:sender,signers:{type:"array",minItems:1,maxItems:20,items:object({slot_id:s(),name:s({minLength:2,maxLength:100}),email:s({format:"email"}),phone:s({maxLength:30}),recipient_kind:s({enum:["internal","external"]})},["slot_id","name","email"])}},["template_id","expires_in_days","signers"]);
const receipt = object({template_id:s(),preview_token:s()},["template_id","preview_token"]);
const revision = object({expected_version:{type:"integer",minimum:1},expected_task_version:{type:"integer",minimum:1},form_data:freeObject,documents},["expected_version","expected_task_version","form_data"]);
const paths = {};
function add(method, route, summary, scope, options = {}) {
  const parameters = [...route.matchAll(/\{([^}]+)\}/g)].map(m=>({name:m[1],in:"path",required:true,schema:s(),description:m[1]==="sessionId"?"Opaque secret session credential; do not log.":"Workspace-scoped identifier."}));
  if (scope) parameters.push({name:"X-Dekasign-Environment",in:"header",required:true,schema:s({enum:["sandbox"]})});
  if (options.idempotent) parameters.push({name:"Idempotency-Key",in:"header",required:true,schema:s({minLength:8,maxLength:160,pattern:"^[!-~]+$"})});
  if (options.list) parameters.push({name:"page",in:"query",schema:{type:"integer",minimum:1,default:1}},{name:"size",in:"query",schema:{type:"integer",enum:[25,50,100],default:25}},{name:"q",in:"query",schema:s({maxLength:100})});
  for (const query of options.queries || []) parameters.push({name:query,in:"query",schema:s()});
  const binary = options.pdf;
  const responses = options.retired ? {"410":{description:"ENDPOINT_RETIRED; use /approval-requests."}} : {
    [options.created?"201":"200"]:{description:binary?"Private PDF bytes.":"Operation result. Read fields vary by endpoint and deployment; see narrative guide.",content:{[binary?"application/pdf":"application/json"]:{schema:binary?s({format:"binary"}):{type:"object",additionalProperties:true}}}},
    "400":{description:"Invalid operation or layout."},"401":{description:"Invalid or expired credential/session."},"403":{description:"Scope, environment, tenant or authority denied."},"404":{description:"Not found or outside app scope."},"409":{description:"Stale version, active usage or idempotency conflict."},"422":{description:"Invalid schema or required idempotency key."},"429":{description:"Rate limited."},"503":{description:"Sandbox disabled or operation temporarily unavailable."}
  };
  (paths["/api/v1"+route]??={})[method.toLowerCase()] = {
    operationId:method.toLowerCase()+"_"+route.replace(/[^a-z0-9]+/gi,"_").replace(/^_|_$/g,""),
    summary,tags:[options.tag||route.split("/")[1]],description:options.description||(scope?"Required scope: "+scope+". Sandbox only; app allowlists and requester authority also apply.":"Not an integration-key endpoint. Requires the dedicated session/identity flow described in the guide."),
    security:scope?[{SandboxBearer:[]}]:[],parameters,responses,
    ...(scope?{"x-dekasign-scope":scope}:{}),...(options.body?{requestBody:json(options.body)}:{}),...(options.retired?{deprecated:true}:{}),
  };
}
for (const route of ["categories","request-templates","approval-workflows","request-forms","document-sign-templates"]) {
 add("GET","/"+route,"List "+route,"catalog:read",{list:true,queries:["status","archived"]});
 add("GET","/"+route+"/{id}","Get "+route,"catalog:read");
}
add("POST","/categories","Create a category only","categories:write",{idempotent:true,body:object({name:s({minLength:2,maxLength:100}),description:s({maxLength:500,default:""})},["name"])});
for (const route of ["categories","approval-workflows","request-forms"]) add("POST","/"+route+"/{id}/archive","Archive unused "+route,route==="categories"?"categories:write":"workflows:archive",{idempotent:true,body:reason});
add("GET","/approval-workflows/{id}/releases/{release}/submission-schema","Read pinned release schema","catalog:read");
add("GET","/document-sign-templates/{id}/content","Read source PDF","catalog:read",{pdf:true,queries:["version"]});
add("GET","/approval-requests","List app requests","requests:read",{list:true,queries:["status"]});
add("POST","/approval-requests","Submit a request","requests:create",{created:true,idempotent:true,body:object({workflow_id:s({minLength:1,maxLength:100}),workflow_release_id:s({minLength:1,maxLength:160}),external_id:s({pattern:"^[A-Za-z0-9_.:-]{3,120}$"}),form_data:freeObject,documents,submit:{type:"boolean",default:true}},["workflow_id","workflow_release_id","external_id","form_data"])});
add("GET","/approval-requests/{id}","Read request status and visited steps","requests:read");
add("GET","/approval-requests/{id}/revision-requirements","Read active revision requirements","requests:read");
add("PATCH","/approval-requests/{id}/revision-draft","Save revision draft","requests:revise",{idempotent:true,body:revision});
add("POST","/approval-requests/{id}/resubmit","Resubmit revision","requests:revise",{idempotent:true,body:revision});
add("GET","/documents","List app documents","documents:read",{list:true});
add("GET","/documents/{id}","Read document metadata","documents:read");
add("DELETE","/documents/{id}","Delete unused document","documents:delete",{idempotent:true,body:reason});
add("POST","/documents","Upload one PDF","documents:write",{created:true,idempotent:true,description:"Required scope documents:write. One PDF, maximum 25 MB and 1–200 pages. Sandbox only."});
paths["/api/v1/documents"].post.requestBody={required:true,content:{"multipart/form-data":{schema:object({file:s({format:"binary"}),logicalPurpose:s({enum:["ATTACHMENT","SIGNATURE_TARGET"],default:"ATTACHMENT"})},["file"])}}};
add("POST","/documents/{id}/session","Create one-hour hosted editor session","documents:write",{body:object({purpose:s({minLength:3,maxLength:120,default:"Prepare Instance"})})});
add("GET","/signature-packages","List app signing packages","packages:read",{list:true,queries:["status","archived"]});
add("GET","/signature-packages/{id}","Read signing package","packages:read");
add("POST","/signature-packages/preview","Prepare frozen signing preview","packages:create",{body:preview});
add("POST","/signature-packages/preview/document","Render populated preview PDF","packages:create",{body:receipt,pdf:true});
add("POST","/signature-packages","Send confirmed preview","packages:create",{created:true,idempotent:true,body:object({...receipt.properties,confirmed:{type:"boolean",enum:[true]}},["template_id","preview_token","confirmed"])});
add("POST","/signature-packages/{id}/archive","Archive terminal package","packages:archive",{idempotent:true,body:reason});
add("GET","/hosted-editor/{sessionId}/commands","Read hosted editor state",null);
add("POST","/hosted-editor/{sessionId}/commands","Save or complete hosted layout",null,{body:object({type:s({enum:["SAVE_LAYOUT","COMPLETE"]}),expectedVersion:{type:"integer",minimum:1},layout:freeObject,idempotencyKey:s()},["type","expectedVersion","layout"]),description:"Opaque session credential in path. Idempotency-Key header or body idempotencyKey is required by command execution. Layout follows the server document layout schema; bearer app key is not accepted as this session."});
add("GET","/hosted-editor/{sessionId}/document","Read hosted PDF",null,{pdf:true});
add("POST","/guest/auth","Request or verify recipient OTP",null,{body:{oneOf:[object({action:s({enum:["request_otp"]}),email:s({format:"email"}),requestId:s()},["action","email","requestId"]),object({action:s({enum:["verify_otp"]}),email:s({format:"email"}),requestId:s(),code:s({pattern:"^[0-9]{6}$"})},["action","email","requestId","code"])]}});
add("GET","/signing/{id}/document","Read recipient-authorized PDF",null,{pdf:true});
for (const method of ["GET","POST"]) add(method,"/requests","Retired request endpoint",null,{retired:true});
// Explicit command receipts and pagination: never present a dummy {} as the send result.
const integer={type:"integer"};
const date=s({format:"date-time"});
function receiptSchema(route,method,properties,code="200") {
 paths["/api/v1"+route][method].responses[code].content["application/json"].schema={type:"object",properties,additionalProperties:true};
}
for (const route of ["/categories","/request-templates","/approval-workflows","/request-forms","/document-sign-templates","/approval-requests","/documents","/signature-packages"]) receiptSchema(route,"get",{data:{type:"array",items:freeObject},pagination:object({page:integer,size:{type:"integer",enum:[25,50,100]},total:integer,pages:integer},["page","size","total","pages"])});
receiptSchema("/approval-requests","post",{id:s(),request_number:s(),external_id:s(),workflow_id:s(),workflow_release_id:s(),category_id:s(),request_template_id:s(),form_version:integer,published_version:integer,approval_status:s(),version:integer,request_revision:integer,environment:s({enum:["sandbox"]}),document_approval_mode:s({enum:["digital_only"]})},"201");
receiptSchema("/signature-packages","post",{id:s(),status:s(),expires_at:date,document_id:s(),template_version_id:s(),invitation_status:s({enum:["queued"]}),environment:s({enum:["sandbox"]}),integrity_profile:s({enum:["internal_dekasign"]})},"201");
receiptSchema("/signature-packages/preview","post",{preview_token:s({description:"Secret frozen receipt; valid for 10 minutes. Do not log."}),template_id:s(),template_name:s(),template_version:integer,expires_at:date,preview_valid_until:date,signers:{type:"array",items:freeObject},fields:{type:"array",items:freeObject},pdf_url:s(),pdf_url_is_source:{type:"boolean",enum:[true]},prepared_pdf:object({url:s(),method:s({enum:["POST"]}),body:receipt},["url","method","body"]),notice:s()});
receiptSchema("/signature-packages/{id}","get",{id:s(),status:s(),document_id:s(),template_version_id:s(),created_at:date,expires_at:date,expired_at:{...date,nullable:true},archived_at:{...date,nullable:true},integrity_profile:s({enum:["internal_dekasign"]}),signers:{type:"array",items:freeObject},document_versions:{type:"array",items:freeObject}});
const layout=object({pageCount:{type:"integer",minimum:1,maximum:500},fields:{type:"array",maxItems:200,items:object({id:s(),type:s({enum:["text","date","checkbox","signature"]}),label:s({minLength:1,maxLength:100}),page:{type:"integer",minimum:1},rect:object({x:{type:"number",minimum:0,maximum:1},y:{type:"number",minimum:0,maximum:1},width:{type:"number",exclusiveMinimum:true,minimum:0,maximum:1},height:{type:"number",exclusiveMinimum:true,minimum:0,maximum:1}},["x","y","width","height"]),required:{type:"boolean"}},["id","type","label","page","rect","required"])}},["pageCount","fields"]);
paths["/api/v1/hosted-editor/{sessionId}/commands"].post.requestBody.content["application/json"].schema.properties.layout=layout;
const spec={openapi:"3.0.3",info:{title:"DekaSign sandbox and session API",version:"2026-10-18",description:"Management endpoints are sandbox-only and may return SANDBOX_API_DISABLED on production hosts. Template authoring and human approval decisions are not machine-key APIs. Session routes are separately authenticated. Responses are intentionally extensible; narrative guides document key fields. This specification does not grant access or enable feature flags."},servers:[{url:"https://{workspace}.dekasign.com",description:"Use the authorized sandbox workspace supplied by your administrator.",variables:{workspace:{default:"your-workspace"}}}],paths,components:{securitySchemes:{SandboxBearer:{type:"http",scheme:"bearer",description:"Sandbox dks_test_ key, server-side only."}}}};
fs.writeFileSync(path.resolve("openapi.json"),JSON.stringify(spec,null,2)+"\n");
console.log("Generated "+Object.values(paths).reduce((n,p)=>n+Object.keys(p).length,0)+" documented operations.");
