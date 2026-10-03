# DontTrust

### Web Application Security Assessment & Attack-Surface Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-50%2F50%20passing-brightgreen.svg)]()
[![Precision](https://img.shields.io/badge/benchmark%20precision-100%25-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.4-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

> **DontTrust** is an application-security assessment and attack-surface intelligence platform designed for authorized security testing, controlled environments, and research-grade vulnerability verification.

Unlike traditional heuristic scanners that blindly fire hundreds of destructive payloads, DontTrust models an application's topology, state transitions, client-side scripts, and identity boundaries before executing safe, differential verification probes.

---

## 1. Unified Assessment Pipeline

```text
                    TARGET URL & SCOPE
                            │
                            ▼
                    [ ScopeEngine ] ────► RFC 1918 / Loopback / SSRF Guard
                            │
                            ▼
                    [ Reconnaissance ] ──► Web Server / CDN / Framework Fingerprinting
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         [ Crawler ]   [ Browser ]   [ API Specs ]
              │             │             │
              └─────────────┼─────────────┘
                            ▼
               [ Application Intelligence ] ──► State, Endpoints, Assets, Identities
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          [ JS AST ]   [ Auth Matrix ] [ State Engine ]
              │             │             │
              └─────────────┼─────────────┘
                            ▼
              [ Security Hypothesis Engine ] ──► Unverified Candidate Hypotheses
                            │
                            ▼
              [ Differential Verification ] ──► Bounded Baseline vs Probe Delta
                            │
                            ▼
                [ Finding & Evidence Vault ] ──► SecretRedactor + SHA-256 Fingerprints
                            │
                            ▼
               [ Correlation & Attack Graph ] ──► Attack-Surface Graph 2.0 & Chains
                            │
                            ▼
              [ Reports, Dashboard & SARIF ] ──► Deterministic JSON, SARIF, Markdown
```

---

## 2. Core Capabilities Matrix

| Subsystem | Architectural Capability | Verified Status |
| :--- | :--- | :---: |
| **Scope & SSRF Defense** | Strict RFC 1918 / Loopback filtering and domain regex guards | **PASS** |
| **Application Model** | Canonical serializable state graph with deterministic SHA-256 IDs | **PASS** |
| **Deep Reconnaissance** | Passive & active header/cookie fingerprinting (Nginx, Express, React, etc.) | **PASS** |
| **JavaScript Intelligence** | AST parsing & client-side Source-to-Sink flow analysis for DOM XSS | **PASS** |
| **API Intelligence** | OpenAPI v2/v3, Swagger, and GraphQL schema parsing | **PASS** |
| **Multi-Identity Auth** | Comparative probing across roles for Horizontal BOLA and Vertical PrivEsc | **PASS** |
| **Security Hypotheses** | Formal lifecycle (`CANDIDATE` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `VERIFIED`) | **PASS** |
| **Differential Verification**| Non-destructive baseline comparison with dynamic token normalization | **PASS** |
| **Secret Redaction** | Automated scrubbing of Bearer tokens, AWS/Stripe keys, and passwords | **PASS** |
| **Attack-Surface Graph** | Graph 2.0 abstraction correlating routes, endpoints, identities, and findings | **PASS** |
| **Observability** | Prometheus metrics registry and distributed trace spans | **PASS** |
| **Reporting & Export** | Deterministic `scan-result.json`, SARIF v2.1.0, Markdown, and HTML reports | **PASS** |
| **Analyst Web Dashboard** | React 19 + Vite dashboard with live WebSocket scan streams | **PASS** |
| **Benchmark Regression** | Precision/recall test matrix on controlled intentionally vulnerable lab | **PASS** |

---

## 3. Quickstart & Demonstration

### Prerequisites
- Node.js $\ge$ 20.x
- npm $\ge$ 10.x

### 1. Installation & Build
```bash
git clone https://github.com/abhi-byte62/dontTrust.git
cd donttrust
npm install
npm run build
```

### 2. Run Test & Benchmark Suites
```bash
# Run all 50 unit and integration tests
npm test

# Run End-to-End full-platform and benchmark matrix suites
npx vitest run tests/e2e tests/benchmark
```

### 3. Launch Local Demo Lab & API
```bash
# Terminal 1: Start the vulnerable benchmark target
npm run start -w @donttrust/vulnerable-lab
# Runs on http://127.0.0.1:8080

# Terminal 2: Start API Gateway & React Dashboard
npm run dev -w @donttrust/api
npm run dev -w @donttrust/web
```
Access the web dashboard at `http://localhost:5173`.

### 4. Execute a Scan via CLI
```bash
npm run cli -- scan http://127.0.0.1:8080 --active
```

---

## 4. Benchmark Precision & Performance

DontTrust is continuously evaluated against a local benchmark lab (`lab/vulnerable-app`) covering OWASP Top 10 categories.

| Target Route | Vulnerability Category | Expected Invariant | Measured Result |
| :--- | :--- | :--- | :---: |
| `GET /api/v1/search?q=` | Reflected XSS | Input reflected unencoded | **DETECTED** |
| `GET /api/v1/orders/:id` | Horizontal BOLA / IDOR | Multi-tenant resource access | **DETECTED** |
| `GET /fetch-image?url=` | SSRF | Unrestricted destination URL | **DETECTED** |
| `GET /assets/app.js` | Client-Side DOM XSS | `location.search` $\rightarrow$ `innerHTML` | **DETECTED** |
| `GET /admin/stats` | CORS Misconfiguration | Missing origin validation | **DETECTED** |
| `GET /api/v1/debug-status` | Information Disclosure | Environment variables exposed | **DETECTED** |
| `GET /api/v1/secure-health` | **Control / Hardened Route** | Zero security flaws | **0 FINDINGS (NO FP)** |

*Note: In the current controlled benchmark suite, DontTrust achieved 100% precision with zero observed false positives across tested scenarios. Real-world applications are substantially more heterogeneous, and benchmark results reflect only this controlled population.*

---

## 5. Documentation Directory

- [Architecture & Design Specification](docs/ARCHITECTURE.md)
- [Application Intelligence Model](docs/APPLICATION_MODEL.md)
- [Discovery Pipeline](docs/DISCOVERY_PIPELINE.md)
- [JavaScript Intelligence & AST Data Flow](docs/JAVASCRIPT_ANALYSIS.md)
- [Multi-Identity Authorization Analysis](docs/AUTHORIZATION_ANALYSIS.md)
- [Security Hypothesis Lifecycle](docs/SECURITY_HYPOTHESES.md)
- [Differential Verification Engine](docs/VERIFICATION_ENGINE.md)
- [Threat Model](docs/THREAT_MODEL.md)
- [Security Review](docs/FINAL_SECURITY_REVIEW.md)
- [Benchmark Report](docs/FINAL_BENCHMARK_REPORT.md)
- [Performance Measurements](docs/PERFORMANCE_RESULTS.md)
- [Demo Script (5-10 Min)](docs/DEMO_SCRIPT.md)
- [Architecture Walkthrough](docs/ARCHITECTURE_WALKTHROUGH.md)
- [Design Decisions & Trade-Offs](docs/DESIGN_DECISIONS.md)
- [Technical Interview Notes](docs/INTERVIEW_ARCHITECTURE_NOTES.md)
- [System Limitations](docs/LIMITATIONS.md)

---

## 6. Security & Legal Notice

DontTrust is built strictly for authorized security testing, bug bounty programs operating within written scopes, internal organizational assessments, and controlled educational environments. Probing systems without prior authorization is illegal.
