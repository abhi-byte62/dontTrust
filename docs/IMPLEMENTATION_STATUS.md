# DontTrust: Implementation Status & Repository Truth Audit

This document records the exact implementation status, architectural boundaries, dependencies, and test coverage across the DontTrust platform.

---

## 1. Monorepo Component Audit Table

| Component | Status | Entry Point | Primary Dependencies | Consumed By | Tests | Known Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`@donttrust/common`** | `REAL` | `packages/common/src/index.ts` | None | All packages & services | `test/redactor.test.ts` | Synchronous redactor regexes; highly optimized |
| **`@donttrust/scope-engine`** | `REAL` | `packages/scope-engine/src/index.ts` | `common` | `scanner-sdk`, workers, `api` | `test/scope.test.ts`, `test/ssrf.test.ts` | Bitwise IPv4/IPv6 CIDR check; blocks cloud metadata & RFC1918 |
| **`@donttrust/protocol-models`** | `REAL` | `packages/protocol-models/src/index.ts` | None | All packages & services | `test/models.test.ts` | Canonical models for HTTP, TLS, Forms, Tech, Graph, & Auth |
| **`@donttrust/finding-schema`** | `REAL` | `packages/finding-schema/src/index.ts` | `common`, `protocol-models` | `rules`, `storage`, `correlation-engine`, `api` | `test/finding-builder.test.ts` | Decoupled Severity & Confidence; deterministic fingerprinting |
| **`@donttrust/scanner-sdk`** | `REAL` | `packages/scanner-sdk/src/index.ts` | `common`, `scope-engine`, `finding-schema`, `protocol-models` | `rules`, `api`, services | `test/rate-limiter.test.ts`, `test/state-machine.test.ts`, `test/job-queue.test.ts` | Priority queue (P0-P4) with in-memory broker fallback |
| **`@donttrust/storage`** | `REAL` | `packages/storage/src/index.ts` | `common`, `finding-schema`, `protocol-models`, `scope-engine` | `api`, `cli` | `test/storage.test.ts` | Relational SQL schema DDL with in-memory driver and scan diffing |
| **`@donttrust/differential-engine`** | `REAL` | `packages/differential-engine/src/index.ts` | `common`, `protocol-models` | `api`, `rules` | `test/differential.test.ts` | Dynamic token stripping, tri-gram similarity, structural DOM/JSON diff |
| **`@donttrust/correlation-engine`** | `REAL` | `packages/correlation-engine/src/index.ts` | `common`, `finding-schema`, `protocol-models` | `api` | `test/correlation.test.ts` | Deterministic deduplication & multi-stage attack chain synthesis |
| **`@donttrust/observability`** | `REAL` | `packages/observability/src/index.ts` | `common` | `api`, services | `test/observability.test.ts` | Prometheus metrics exporter & OpenTelemetry tracing spans |
| **`@donttrust/recon-worker`** | `REAL` | `services/recon-worker/src/index.ts` | `common`, `protocol-models`, `scanner-sdk`, `scope-engine` | `api` | `test/recon.test.ts` | DNS, TLS cert probing, port scanning, banner fingerprinting |
| **`@donttrust/crawler-worker`** | `REAL` | `services/crawler-worker/src/index.ts` | `common`, `protocol-models`, `scanner-sdk`, `scope-engine` | `api` | `test/crawler.test.ts` | Canonical URL normalization, form parameter extraction |
| **`@donttrust/browser-worker`** | `REAL` | `services/browser-worker/src/index.ts` | `common`, `protocol-models`, `scanner-sdk`, `scope-engine` | `api` | `test/browser-worker.test.ts` | Static DOM parser + browser automation; preserves full handler expressions |
| **`@donttrust/js-analyzer`** | `REAL` | `services/js-analyzer/src/index.ts` | `common`, `protocol-models`, `scanner-sdk` | `api` | `test/js-analyzer.test.ts` | Static route scanner, secret detector, DOM sink analyzer |
| **`@donttrust/auth-analyzer`** | `REAL` | `services/auth-analyzer/src/index.ts` | `common`, `protocol-models`, `scanner-sdk` | `api` | `test/auth-analyzer.test.ts` | Multi-role authorization matrix & privilege escalation detection |
| **`@donttrust/api-analyzer`** | `REAL` | `services/api-analyzer/src/index.ts` | `common`, `protocol-models`, `scanner-sdk` | `api` | `test/api-analyzer.test.ts` | OpenAPI, Swagger, and GraphQL schema discovery |
| **`@donttrust/rules`** | `REAL` | `rules/src/index.ts` | `scanner-sdk`, `finding-schema`, `protocol-models`, `scope-engine` | `api`, `cli` | `test/rules.test.ts` | 7 active security rules (SSRF, CORS, Headers, Cookies, SQLi, XSS, Info) |
| **`@donttrust/api`** | `REAL` | `apps/api/src/index.ts` | Express, WS, monorepo packages | `apps/web`, `apps/cli` | `test/api.test.ts` | REST API, WebSocket broadcaster, scan orchestrator, SARIF exporter |
| **`@donttrust/web`** | `REAL` | `apps/web/src/main.tsx` | React 19, Lucide, Vite | End users / Analysts | Vite production bundle | Cyber-themed dashboard, live telemetry, graph explorer |
| **`@donttrust/cli`** | `REAL` | `apps/cli/src/index.ts` | Commander, monorepo packages | Security engineers | `test/cli.test.ts` | Command-line scanner runner and SARIF export |
| **`@donttrust/vulnerable-lab`**| `REAL` | `lab/vulnerable-app/src/index.ts` | Express | End-to-end benchmark | `tests/e2e/scanner-benchmark.test.ts` | Authorized test bench with real CORS, SSRF, SQLi, XSS vulnerabilities |

---

## 2. Classification Definitions

- **`REAL`**: Full production-grade implementation with complete input validation, unit tests, and runtime execution.
- **`PARTIAL`**: Core interface defined with essential implementation, pending extended edge-case coverage.
- **`MOCKED`**: Emulated data structure for simulation during unit isolation tests.
- **`STUB`**: Interface placeholder with no functional logic.
- **`UNUSED`**: Deprecated or unreferenced artifact.
- **`BROKEN`**: Code failing compilation or unit assertions.

---

## 3. Dependency Flow Graph

```text
packages/common
  │
  ├──► packages/scope-engine
  ├──► packages/protocol-models
  │      │
  │      └──► packages/finding-schema
  │             │
  │             └──► packages/scanner-sdk
  │                    │
  │                    ├──► packages/storage
  │                    ├──► packages/differential-engine
  │                    ├──► packages/correlation-engine
  │                    ├──► packages/observability
  │                    │
  │                    ├──► services/recon-worker
  │                    ├──► services/crawler-worker
  │                    ├──► services/browser-worker
  │                    ├──► services/js-analyzer
  │                    ├──► services/auth-analyzer
  │                    ├──► services/api-analyzer
  │                    │
  │                    └──► rules/
  │                           │
  │                           └──► apps/api
  │                                  │
  │                                  ├──► apps/cli
  │                                  └──► apps/web
```
