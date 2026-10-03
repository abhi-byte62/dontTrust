# Performance Architecture & Resource Governance

## Concurrency & Rate Limiting

DontTrust incorporates adaptive concurrency controls to prevent service disruption on target systems.

Implemented in:
- Rate Limiter: [`AdaptiveRateLimiter`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/scanner-sdk/src/rate-limiter.ts)
- Metrics Registry: [`MetricsRegistry`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/observability/src/metrics.ts)

## Performance Controls

1. **Adaptive Token Bucket**:
   - Per-target request rate limits (default 50 requests/second, configurable).
   - Dynamic backpressure triggered when target response latencies exceed 2000ms or 429/503 status codes are observed.

2. **Bounded Queue Architecture**:
   - Crawl queue and probe queue enforce bounded memory depth to prevent heap exhaustion on large applications.

3. **Circuit Breakers & Timeouts**:
   - Per-request timeout default: 5000ms.
   - Circuit breaker trips and aborts scan if target error rate exceeds 50% across 20 consecutive requests.

4. **Deterministic Caching**:
   - Response hashes and AST representations are cached in-memory during scan execution.
