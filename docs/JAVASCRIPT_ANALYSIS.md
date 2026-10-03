# JavaScript Intelligence & Source-to-Sink Analysis

## Overview

The JavaScript Analysis Subsystem ([`JavaScriptAnalyzer`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/services/js-analyzer/src/index.ts)) analyzes client-side bundles and inline scripts without relying on superficial regex matches.

## Subsystem Capabilities

1. **Endpoint & Route Extraction**:
   - Detects dynamic `fetch()`, `axios()`, `XMLHttpRequest`, `WebSocket`, and `EventSource` invocations.
   - Identifies parameterized API paths (e.g. `/api/v1/users/${id}`).

2. **Secret & Key Detection**:
   - Detects exposed credentials, high-entropy tokens, AWS access keys (`AKIA...`), Stripe keys (`pk_live_...`, `sk_live_...`), and authorization JWTs.
   - Redacts token values before telemetry and log emission.

3. **Client-Side Source-to-Sink Data-Flow Engine**:
   - Models data flow from untrusted client sources to execution sinks:
     - **Sources**: `location.search`, `location.hash`, `URLSearchParams`, `document.referrer`, `window.postMessage`, `localStorage`, `sessionStorage`, `document.cookie`
     - **Sinks**: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval()`, `Function()`, `setTimeout(string)`, `setInterval(string)`, `script.src`
   - Classifies tainted paths into structured [`SecurityHypothesis`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/application-model/src/types.ts) records (`POTENTIAL_DOM_XSS`) with precise line and character offsets.
