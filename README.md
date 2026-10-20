# DekaSign documentation

Public user guides and developer reference for https://docs.dekasign.com, maintained from the DekaSign application source. The connected Mintlify project is `deka-sign/deka-sign`; pushes to `ismail069/dekasign-docs` branch `main` deploy automatically.

## Content

- Native language switcher: Indonesian (`id`, default, original root URLs) and English (`en`, `/en/...`). All 27 authored pages have English counterparts, including developer guides. Each language has its own navbar labels and endpoint-reference directory. Technical API action labels stay in English to preserve existing endpoint URLs; Indonesian endpoint explanations are translated.
- 18 product guides cover onboarding, roles/settings, email/WhatsApp, Email Studio, categories, Form Builder, canvas/Sandbox, request/revision/delegation, Document Sign and Secure Sharing.
- 9 developer/integration guides explain sandbox keys, catalog/versions, request/revision, PDF upload, preview/send, session authentication, errors and outgoing webhooks.
- `openapi.json` covers all 44 HTTP methods found in the application's 37 v1 route files. Human-session and retired routes are labelled separately. Read responses are extensible rather than pretending every response has the same schema.
- Availability gates are explicit: SSO deferred, ALL/ANY and external approval admission not active, management API sandbox-only, certified seal not provided.

## Development

Use Node 20.17+ and the official Mintlify CLI:

```bash
npm install -g mint
mint dev --no-open --port 3188
mint validate
mint broken-links
node scripts/verify-docs.mjs
```

The source-parity check expects the app in sibling `../dekasign-app`, or use `DEKASIGN_APP_SOURCE` with the app checkout path. Regenerate the reviewed specification with `node scripts/generate-openapi.mjs`, then `node scripts/localize-openapi.mjs`. The localizer fails on unknown explanatory text instead of silently publishing untranslated prose. Review command schemas against source whenever endpoints change; generation is not runtime proof.

Keep translated pages under `en/` with the same file names and structure as the Indonesian originals. Update both language versions together, preserve technical identifiers, and run `node scripts/verify-docs.mjs`, `mint validate`, and `mint broken-links`. `node scripts/configure-languages.mjs` refreshes the paired navigation without moving the original Indonesian pages. Legal policy text remains authoritative Indonesian; this translation does not publish an English legal agreement.

Windows CLI note (Mint4.2.819): `mint broken-links` reports false positives for forward-slash links to nested `en/guides/...` files. Its installed link resolver compares forward-slash URL directories with backslash filesystem directories. The existing file and empty resolver result were reproduced without modifying the CLI. Do not rewrite valid public URLs to bypass this. The repository's cross-platform link/parity check and actual deployed route checks are required alongside successful `mint validate`; do not describe this CLI run as a clean broken-links pass.

Brand assets in `images/` are byte-identical to the Owner-supplied `logo-dekasign.png` and `favicon-dekasign.png`. The same original logo is used for both themes, with a white backing in dark mode so its dark wordmark stays legible.

Live acceptance on 18 October 2026: `node scripts/verify-live-locales.mjs` passed all 52 authored routes, translated titles, hreflang, supplied logo, isolation marker, and absence of response cookies. Edge verified English search → delegation guide, the same-page English → Indonesian switch, and Indonesian → English endpoint navigation with translated explanations and unchanged parameters. Hydrated document language is `id`/`en` respectively. Mintlify currently emits `lang=en` in its initial SSR shell even for Indonesian routes; this vendor limitation is not recorded as a passing SSR-language check. Light/dark branding was checked and the theme restored to System.

Local reconciliation on 20 October 2026 adds the Secure Sharing pair (54 authored pages total), request-document preparation and Process rules, shared 15 MB signing/API limits, six sharing slots with 15 MB/25 MB ZIP limits, hosted-session expiry/revocation, callback selection and webhook read/archive. `node scripts/verify-docs.mjs` checks both localized contracts against all 44 source operations and shared upload limits. These changes are not published; the earlier 52-route live receipt does not cover the new pages or content. Customer/provider acceptance and n8n/Drive/OneDrive remain paused under integration item 12.

## Publishing and security

No secret, API token, OTP, production customer file or private signing URL belongs in this repository. API playground is disabled to discourage entering secrets in a public browser reference. Use only an authorized sandbox with synthetic data for examples.

The public site uses halo@dekasign.com. DekaSign integrity evidence is internal, not a certified electronic seal or trusted timestamp. Documentation does not enable feature flags or constitute successful production acceptance.

Legal content is published by the application, not duplicated here: https://dekasign.com/id/privacy and https://dekasign.com/id/terms. Authoritative legal text is Indonesian.

Reviewed 18 October 2026 against application source `99f3cbe4` plus the accompanying public-site/documentation change. Verify current deployed version before relying on a newly described UI feature.

The local 20 October reconciliation was reviewed against application checkpoint `199b9d7`. It preserves sandbox-only availability and separates locally tested updates from production acceptance. Publishing this repository remains a separate rollout action.

Local 21 October source update against application checkpoint `ee4b9cf`: ZIP and its member previews are excluded from watermarking; permitted ZIP downloads retain the original archive. Document Sign has separate workflow and standalone editor entries. Every workflow field requires a valid Actor assignment, including optional inputs. Automatic workflow mode defaults and full external submission mapping remain open. No publishing or deployed acceptance is implied.
