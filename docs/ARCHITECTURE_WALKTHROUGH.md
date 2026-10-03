# DontTrust: Deep Architecture Walkthrough — Tracing a Single Vulnerability

This document traces the complete lifecycle of a single vulnerability (**Horizontal BOLA/IDOR on `/api/v1/orders/:id`**) across the entire DontTrust subsystem chain.

---

```text
1. DISCOVERY
   Crawler / API Analyzer parses OpenAPI path:
   GET /api/v1/orders/{id}
   ↓
2. APPLICATION MODEL REGISTRATION
   Registered in ApplicationModel:
   - Endpoint ID: GET:127.0.0.1:/api/v1/orders/:id
   - Parameter: id (in path, required)
   - Scope: In-scope (127.0.0.1)
   ↓
3. MULTI-IDENTITY PROBING
   AuthorizationComparator executes identical GET probe across distinct tenant contexts:
   - Identity A (Tenant 1): GET /api/v1/orders/101 ──► 200 OK (Alice's Order)
   - Identity B (Tenant 2): GET /api/v1/orders/101 ──► 200 OK (Alice's Order)
   ↓
4. SECURITY HYPOTHESIS GENERATION
   Authorization anomaly detected:
   - Type: POTENTIAL_HORIZONTAL_IDOR
   - Status: CANDIDATE
   - Confidence: HIGH
   - Evidence: Tenant B successfully accessed cross-tenant resource without 403 Forbidden.
   ↓
5. PRIORITIZATION
   ScanTaskPrioritizer assigns P0 priority due to:
   - Authenticated boundary breach
   - Multi-tenant data exposure
   ↓
6. DIFFERENTIAL VERIFICATION
   DifferentialEngine executes baseline comparison:
   - Normalized status code: 200 vs 200
   - Schema identity: Matching order response structure
   - Verifier confirms hypothesis
   ↓
7. EVIDENCE GENERATION & SECRET REDACTION
   SecretRedactor scrubs session cookies and bearer headers:
   - Authorization: Bearer [REDACTED_BEARER_TOKEN]
   - Response snippet captured with timestamp
   ↓
8. FINDING CREATION & GRAPH LINKING
   FindingRecord created with deterministic fingerprint:
   sha256(IDOR_HORIZONTAL:127.0.0.1:/api/v1/orders/:id:id)
   Linked in Attack-Surface Graph:
   Node(ENDPOINT) ──[AFFECTS]──► Node(FINDING)
   ↓
9. CORRELATION & REPORT EMISSION
   Correlated with exposed admin routes to synthesize attack chain.
   Exported to scan-result.json, SARIF v2.1.0, and streamed to React UI.
```
