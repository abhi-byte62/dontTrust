# DontTrust: Comprehensive Architecture & Data Flow Reference

## 1. Pipeline Overview

DontTrust transforms web application security scanning from unstructured fuzzing into a deterministic, multi-phase application understanding pipeline:

```text
Target URL & Scope Definition
             │
             ▼
     [ ScopeEngine ] ──► (Validates RFC 1918 / SSRF / Domain Invariants)
             │
             ▼
    [ Recon Worker ] ──► (Fingerprints Web Servers, CDNs, Frameworks, robots.txt, sitemaps)
             │
             ▼
   [ Crawler Worker ] ──► (Static HTML link/form extraction & normalization)
             │
             ▼
   [ Browser Worker ] ──► (Headless DOM rendering, SPA client routes, onClick events)
             │
             ▼
     [ JS Analyzer ]  ──► (AST parsing, client-side source-to-sink flow, token extraction)
             │
             ▼
    [ API Analyzer ]  ──► (OpenAPI / Swagger parsing & GraphQL introspection)
             │
             ▼
 [ ApplicationModel ] ──► (Canonical state graph, endpoints, identities, forms, assets)
             │
             ▼
   [ Auth Analyzer ]  ──► (Multi-Identity differential probe: Horizontal BOLA & Vertical PrivEsc)
             │
             ▼
[ SecurityHypotheses ] ──► (Candidate hypotheses queued for verified proof)
             │
             ▼
[ DifferentialEngine ] ──► (Safe, bounded baseline vs probe verification & reflection extraction)
             │
             ▼
  [ Finding Schema ]  ──► (Canonical FindingRecord with full reproducible evidence & redactor)
             │
             ▼
[ CorrelationEngine ] ──► (Correlates related findings & synthesizes attack chains)
             │
             ▼
  [ Storage & Graph ] ──► (Attack-Surface Graph 2.0 nodes, edges, persisted artifacts)
             │
             ▼
[ Reports & Dashboard]──► (Deterministic JSON, SARIF, Markdown, HTML, React Web telemetry)
```

## 2. Monorepo Workspaces

- `packages/application-model`: Canonical application state and hypothesis engine.
- `packages/common`: Secret redactor, cryptographic hasher, structured logger.
- `packages/correlation-engine`: Multi-stage finding correlation and attack chain synthesizer.
- `packages/differential-engine`: Baseline vs probe differential verifier.
- `packages/finding-schema`: Strict typed FindingRecord, FindingEvidence, and FindingBuilder.
- `packages/observability`: Prometheus metrics registry and distributed tracing.
- `packages/protocol-models`: Canonical HTTP, WebSocket, Identity, and Graph models.
- `packages/scanner-sdk`: Rate limiter and job broker.
- `packages/scope-engine`: Scope rules and SSRF private-network protection.
- `packages/storage`: File-backed database and attack-surface graph repository.
- `services/api-analyzer`: OpenAPI and GraphQL schema parser.
- `services/auth-analyzer`: Multi-role identity comparator.
- `services/browser-worker`: Headless Playwright DOM emulator.
- `services/crawler-worker`: Form extractor and static crawler.
- `services/js-analyzer`: Source-to-sink client data-flow engine.
- `services/recon-worker`: Technology and security metadata fingerprinter.
- `apps/api`: Express & WebSocket gateway and scan orchestrator.
- `apps/cli`: DontTrust CLI executable.
- `apps/web`: React 19 + Vite attack-surface explorer and security dashboard.
- `lab/vulnerable-app`: Intentionally vulnerable local benchmark target.
