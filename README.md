# DekaSign documentation

Public user guides and developer reference for https://docs.dekasign.com, maintained from the DekaSign application source. The connected Mintlify project is `deka-sign/deka-sign`; pushes to `ismail069/dekasign-docs` branch `main` deploy automatically.

## Current guide coverage

The site has paired Indonesian and English content. Indonesian is the default and keeps root URLs; English pages use `/en/...`. Navigation currently contains 37 authored pages per language. Each language has its own navbar labels and endpoint-reference directory. Product names and technical identifiers remain in English where required by the product.

- **Owner setup:** organization settings and timezone, categories, inviting another approver, category/form permissions, Form Builder, published workflow, Request Form Template, Sandbox and first submission. Self-approval remains prohibited.
- **Organization management:** Organization Hierarchy with table/full diagram, Direct Manager, Access Profiles and Owner Reports.
- **Forms and approval:** Form Builder, Dynamic Table CSV templates/import, request templates and default documents, optional/mandatory documents, field data sources, workflow canvas/logging, Sandbox, requests/revisions and delegation.
- **Operational work:** Operation Task, My Tasks, Team Queue, category-based staff visibility, availability, returning work and requester-visible results.
- **Personal work:** My Projects for private request/document collections and My Signature for drawn, typed, uploaded or document-specific QR signatures.
- **Documents and communication:** Document Sign, Verify Document, document data, Secure Document Sharing, notification channels and Email Studio.
- **Developers:** authentication/scopes, catalogs and versions, requests/revisions, document preparation, signing packages, hosted editor, errors and outgoing webhooks. Availability and environment requirements belong in the current guides and API specification rather than being inferred from an old release receipt.

`docs.json` owns the paired navigation. Add a page to both languages and both navigation trees. The verifier checks required pages, locale parity, internal paths, branding, shared application upload limits and API route/specification parity; it does not depend on a fixed historical page count.

## Development

Use Node 20.17+ and the official Mintlify CLI:

```bash
npm install -g mint
mint dev --no-open --port 3188
mint validate
mint broken-links
node scripts/verify-docs.mjs
```

Read `AGENTS.md` and the installed Mintlify skill before editing. Match existing MDX frontmatter, use root-relative internal URLs without extensions, and keep both language versions synchronized. Do not regenerate navigation from an older page catalog without preserving the current guides.

The source-parity check expects the app in sibling `../dekasign-app`. Set `DEKASIGN_APP_SOURCE` to use another application checkout. Regenerate a reviewed API specification with `node scripts/generate-openapi.mjs`, then `node scripts/localize-openapi.mjs`. Review request schemas and availability against the actual application. Generating a specification is not proof that the runtime flow succeeded.

Windows CLI note: `mint broken-links` can report false positives for forward-slash links to nested `en/guides/...` files. This was reproduced in Mint4.2.819: the installed resolver compared URL directories with backslash filesystem directories. Do not rewrite valid public URLs to bypass it. Run the repository's cross-platform link/parity check and deployed route checks alongside `mint validate`; record a flagged CLI run as a limitation, not as a clean broken-links pass.

## Screenshots and branding

Use actual application screenshots with reviewed customer/synthetic content and descriptive alt text. Do not create screenshots that imply an untested UI or expose tokens, credentials or private documents. Shared screenshots under `images/app/` may be used by both language guides; explain the steps in each guide's language.

Brand assets in `images/` are the Owner-supplied `logo-dekasign.png` and `favicon-dekasign.png`. Preserve their original bytes. The logo uses a white backing in dark mode to keep its wordmark readable.

## Publishing and security

No secret, API token, OTP, production customer file or private signing URL belongs in this repository. The API playground is disabled to discourage entering secrets into a public reference page. Use authorized test data when capturing examples.

Support links use `support@dekasign.com`. General and sales inquiries use `halo@dekasign.com`. Legal content remains in the application at https://dekasign.com/id/privacy and https://dekasign.com/id/terms; these guides do not replace those policies.

Review application changes before publishing their documentation. A documentation push does not deploy the application, apply its database changes, activate an integration or establish successful production acceptance. Google Drive, OneDrive, n8n and expanded SSO remain separate from the core documentation work unless explicitly resumed.

## Historical acceptance receipts

The 18 October 2026 live receipt checked the then-current 52 authored routes, locale switching, branding and language behavior. The 20–21 October source reconciliations covered a smaller, earlier product scope and were not evidence for later UI, upload limits or production availability. These historical receipts do not replace a current validation of the expanded guides.

`scripts/verify-live-locales.mjs` checks deployed routes. Review its current page coverage before relying on a new live receipt. Mintlify's initial SSR language shell was previously observed as `lang=en` for Indonesian routes; do not describe that vendor behavior as a passing Indonesian SSR-language check without revalidation.
