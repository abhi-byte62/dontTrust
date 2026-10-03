# DontTrust Benchmark Lab & Regression Matrix

## Benchmark Architecture

The local benchmark lab ([`lab/vulnerable-app/src/index.ts`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/lab/vulnerable-app/src/index.ts)) and regression test suite ([`tests/benchmark/benchmark-matrix.test.ts`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/tests/benchmark/benchmark-matrix.test.ts)) validate detection precision and false-positive immunity.

## Benchmark Matrix

| Endpoint | Target Vulnerability / Invariant | Expected Detection | Expected Severity |
|---|---|---|---|
| `GET /api/v1/search?q=` | Reflected XSS (Unescaped query reflection) | `REFLECTED_XSS` | `HIGH` |
| `GET /api/v1/debug-status` | Information Disclosure (Environment leakage) | `INFO_DISCLOSURE` | `MEDIUM` |
| `GET /api/v1/orders/:id` | Horizontal IDOR / BOLA (Multi-tenant) | `IDOR_HORIZONTAL` | `HIGH` |
| `GET /fetch-image?url=` | Server-Side Request Forgery (SSRF) | `SSRF_URL_PARAM` | `HIGH` |
| `GET /admin/stats` | Missing CORS & Exposed Admin endpoint | `CORS_MISCONFIG` | `MEDIUM` |
| `GET /assets/app.js` | Client-Side Source-to-Sink DOM XSS | `DOM_XSS` | `HIGH` |
| `GET /api/v1/secure-health` | Hardened / Safe Route (Control) | **0 Findings (No False Positives)** | `N/A` |

## Execution

Run regression benchmarks locally:
```bash
npx vitest run tests/benchmark/benchmark-matrix.test.ts
```
Expected metrics:
- Precision: 100%
- False Positive Rate: 0%
- Redaction Integrity: 100% (No raw tokens in logs or artifacts)
