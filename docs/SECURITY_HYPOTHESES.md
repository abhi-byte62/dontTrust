# Security Hypothesis Lifecycle & Promotion Engine

## Core Concept

To eliminate false positives and maintain research-grade assessment rigor, DontTrust introduces the **Security Hypothesis** abstraction ([`packages/application-model/src/types.ts`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/application-model/src/types.ts)).

A hypothesis is **not** a finding. It is a structured security thesis generated during static analysis, reconnaissance, or crawling that requires empirical verification.

## Hypothesis Lifecycle

```text
       Discovery / AST Analysis / Differential Probe
                             │
                             ▼
                    ┌─────────────────┐
                    │    CANDIDATE    │
                    └────────┬────────┘
                             │
                             ▼ (Prioritized by ScanTaskPrioritizer)
                    ┌─────────────────┐
                    │  INVESTIGATING  │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     (Safe Probe Verified)            (Refuted by Target Guard)
            │                                 │
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │    VERIFIED     │               │    DISMISSED    │
   └────────┬────────┘               └─────────────────┘
            │
            ▼
┌───────────────────────┐
│ PROMOTED_TO_FINDING   │ ───► Emitted as Canonical FindingRecord
└───────────────────────┘
```

## Supported Hypothesis Types

- `POTENTIAL_DOM_XSS`: Untrusted source reaches browser execution sink.
- `POTENTIAL_HORIZONTAL_IDOR`: Multi-identity differential probe indicates shared resource access.
- `POTENTIAL_VERTICAL_PRIV_ESC`: Non-privileged role invokes privileged operation.
- `POTENTIAL_REFLECTED_XSS`: Parameter value reflected without encoding.
- `POTENTIAL_SSRF`: URL parameter forwarded to remote backend request.
- `POTENTIAL_EXPOSED_SECRET`: Unredacted private API token identified in script assets.
- `POTENTIAL_CORS_MISCONFIG`: Wildcard `Access-Control-Allow-Origin` with credentials.
- `POTENTIAL_BROKEN_AUTH`: Anonymous access to sensitive endpoints.
