# Discovery Pipeline Architecture

## Pipeline Flow

The DontTrust discovery pipeline ingests target configurations, enforces scope boundaries, and orchestrates multi-modal discovery passes to enrich the [`ApplicationModel`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/application-model/src/application-model.ts).

```text
Target Configuration
  ↓
ScopeEngine Validation (packages/scope-engine)
  ↓
Deep Reconnaissance (services/recon-worker)
  ├── Server & CDN Header Fingerprinting
  ├── Security Probes: /robots.txt, /sitemap.xml, /.well-known/security.txt
  └── API Catalog Probes: /openapi.json, /swagger.json
  ↓
HTTP Crawler (services/crawler-worker)
  ├── Static HTML parsing & Link extraction
  ├── Form element discovery & action modeling
  └── Relative/absolute URL normalization
  ↓
Headless Browser Worker (services/browser-worker)
  ├── DOM Event Handler discovery (onClick, onSubmit)
  ├── Single-Page Application (SPA) client routes
  └── Network transaction interception
  ↓
JavaScript Intelligence (services/js-analyzer)
  ├── AST & Token pattern parsing
  ├── Source-to-sink data flow analysis
  └── API base path & route literal extraction
  ↓
API Intelligence (services/api-analyzer)
  ├── OpenAPI v2/v3 & Swagger schema normalization
  └── GraphQL Schema AST parsing & Introspection query analysis
  ↓
Application Intelligence Model Consolidation
  └── Attack-Surface Graph 2.0 Generation
```

## Incremental Graph Enrichment

When new endpoints or routes are discovered at any stage:
1. The entity is normalized and checked against the [`ScopeEngine`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/scope-engine/src/scope-engine.ts).
2. If in-scope, it is registered with unique SHA-256 identifiers into the Application Model.
3. Attack-Surface graph nodes and directed edges are linked with appropriate relationship labels (`DISCOVERED_FROM`, `CALLS`, `USES`).
4. High-priority endpoints are queued into [`ScanTaskPrioritizer`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/apps/api/src/prioritizer.ts).
