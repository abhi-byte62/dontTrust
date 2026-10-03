# AegisScan: Testing Strategy & Verification Framework

This document outlines the testing architecture, regression suites, and validation contracts enforced across the AegisScan platform.

---

## 1. Testing Hierarchy

```text
               ┌──────────────────────────────┐
               │    E2E Vulnerable Lab &      │
               │ Reproducibility Suite (Vitest)│
               └──────────────┬───────────────┘
                              │
               ┌──────────────┴───────────────┐
               │  Integration & API Contract  │
               │    Suites (Supertest & WS)   │
               └──────────────┬───────────────┘
                              │
               ┌──────────────┴───────────────┐
               │  Unit Isolation & Algorithm  │
               │  Verification (All Packages) │
               └──────────────────────────────┘
```

1. **Unit Isolation Suites (`packages/*`, `services/*`, `rules/*`):**
   - Cryptographic hashing & entropy secret redaction (`@aegisscan/common`)
   - Bitwise IPv4/IPv6 CIDR range evaluations & SSRF defense (`@aegisscan/scope-engine`)
   - Decoupled Severity & Confidence schema constraints (`@aegisscan/finding-schema`)
   - Token-bucket rate limiting and P0-P4 priority queues (`@aegisscan/scanner-sdk`)
   - Tri-gram Dice coefficient similarity and dynamic token stripping (`@aegisscan/differential-engine`)
   - Deterministic deduplication & attack chain synthesis (`@aegisscan/correlation-engine`)
   - Static DOM event parser & handler preservation (`@aegisscan/browser-worker`)
   - Non-destructive canary exploit verifications (`@aegisscan/rules`)

2. **Integration Suites (`apps/api`):**
   - REST API endpoints for project, target, scope, scan, findings, and graph management
   - Real-time WebSocket scan lifecycle event broadcasting
   - Multi-format report generation (SARIF 2.1.0, JSON, Markdown, HTML)

3. **End-to-End & Reproducibility Suite (`tests/e2e`):**
   - **`tests/e2e/scanner-benchmark.test.ts`**: Launches real vulnerable lab target server and executes an active assessment, verifying detection of CORS misconfiguration, SSRF canary, SQLi, XSS, and exposed debug artifacts.
   - **`tests/e2e/scan-artifact-verification.test.ts`**: Runs consecutive scans against the same target, generating `scan-result.json` and asserting that finding counts, fingerprints, and graph nodes are 100% deterministic and reproducible.

---

## 2. Test Execution Commands

### Run Complete Monorepo Test Suite
```bash
npm test
```

### Run End-to-End Benchmark & Reproducibility Suite
```bash
npx vitest run tests/e2e
```

### Run Specific Package Tests
```bash
npx vitest run packages/scope-engine
npx vitest run packages/finding-schema
npx vitest run packages/differential-engine
npx vitest run packages/correlation-engine
npx vitest run services/browser-worker
```

### Run Monorepo Production Build
```bash
npm run build
```

---

## 3. Automated Guardrails

- **Zero Unjustified Skips:** Tests do not use `@ts-ignore`, `test.skip`, or mock stubs to artificially satisfy assertions.
- **SSRF Immunity:** Verification tests explicitly attempt out-of-scope and private IP connections (`127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`, `file://`) and assert that they are strictly blocked prior to network socket allocation.
- **Secret Redaction:** High-entropy authorization headers, API keys, passwords, and private tokens are verified to be redacted (`[REDACTED_...]`) in both log outputs and saved evidence records.
