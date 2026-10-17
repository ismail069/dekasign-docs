# DekaSign documentation

Public user guides and developer reference for https://docs.dekasign.com, maintained from the DekaSign application source. The connected Mintlify project is `deka-sign/deka-sign`; pushes to `ismail069/dekasign-docs` branch `main` deploy automatically.

## Content

- 17 product guides cover onboarding, roles/settings, email/WhatsApp, Email Studio, categories, Form Builder, canvas/Sandbox, request/revision/delegation and Document Sign.
- 9 developer/integration guides explain sandbox keys, catalog/versions, request/revision, PDF upload, preview/send, session authentication, errors and outgoing webhooks.
- `openapi.json` covers all 40 HTTP methods found in the application's 33 v1 route files. Human-session and retired routes are labelled separately. Read responses are extensible rather than pretending every response has the same schema.
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

The source-parity check expects the app in sibling `../dekasign-app`, or use `DEKASIGN_APP_SOURCE` with the app checkout path. Regenerate the reviewed specification with `node scripts/generate-openapi.mjs`. Review command schemas against source whenever endpoints change; generation is not runtime proof.

## Publishing and security

No secret, API token, OTP, production customer file or private signing URL belongs in this repository. API playground is disabled to discourage entering secrets in a public browser reference. Use only an authorized sandbox with synthetic data for examples.

The public site uses halo@dekasign.com. DekaSign integrity evidence is internal, not a certified electronic seal or trusted timestamp. Documentation does not enable feature flags or constitute successful production acceptance.

Legal content is published by the application, not duplicated here: https://dekasign.com/id/privacy and https://dekasign.com/id/terms. Authoritative legal text is Indonesian.

Reviewed 18 October 2026 against application source `99f3cbe4` plus the accompanying public-site/documentation change. Verify current deployed version before relying on a newly described UI feature.
