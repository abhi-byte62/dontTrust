# Canonical Evidence Model & Secret Redaction

## Evidence Architecture

Every security finding emitted by DontTrust must be backed by reproducible, verifiable evidence. Findings without evidence are rejected at schema validation.

Implemented in:
- Finding Builder: [`FindingBuilder`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/finding-schema/src/finding-builder.ts)
- Redactor: [`SecretRedactor`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/common/src/redactor.ts)
- Evidence Schema: [`packages/finding-schema/src/types.ts`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/finding-schema/src/types.ts)

## Evidence Graph Structure

```text
FindingRecord
 ├── evidence: FindingEvidence
 │    ├── request: HttpRequest
 │    ├── response: HttpResponse
 │    ├── extractedSnippets: string[]
 │    ├── payloadUsed?: string
 │    ├── proofDescription: string
 │    └── browserEvent?: BrowserEventRecord
 └── provenance: FindingProvenance
      ├── ruleId: string
      ├── discoveredAt: string (ISO 8601)
      ├── scannerVersion: string
      ├── confidenceScore: number (0.0 - 1.0)
      ├── verificationStatus: "VERIFIED" | "UNVERIFIED" | "HEURISTIC"
      └── hypothesisId?: string
```

## Mandatory Secret Redaction

All evidence payloads, HTTP headers, request/response bodies, log streams, and UI representations pass through the deterministic `SecretRedactor` pipeline.

Redacted entities include:
- `Authorization: Bearer <token>` ──► `[REDACTED_BEARER_TOKEN]`
- `Authorization: Basic <base64>` ──► `[REDACTED_BASIC_AUTH]`
- `Cookie: session=...` ──► `[REDACTED_COOKIE]`
- AWS Access Keys (`AKIA...`) ──► `[REDACTED_AWS_KEY]`
- Stripe API Keys (`sk_live_...`) ──► `[REDACTED_STRIPE_KEY]`
- Passwords & Secret Tokens ──► `[REDACTED_SECRET]`
