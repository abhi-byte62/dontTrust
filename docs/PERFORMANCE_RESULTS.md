# DontTrust: Measured Performance & Resource Utilization

## 1. Test Methodology

Performance measurements were captured during complete end-to-end execution of DontTrust against the local benchmark target suite.

## 2. Empirical Benchmark Metrics

| Metric | Measured Value | Target Gate | Result |
| :--- | :--- | :--- | :---: |
| **Monorepo Build Time** | ~1.89 seconds | < 10.0s | **PASS** |
| **Unit & Integration Tests (50 tests)** | ~7.2 seconds | < 15.0s | **PASS** |
| **Full E2E & Benchmark Suite** | ~2.1 seconds | < 8.0s | **PASS** |
| **Scan Execution Duration (Local Lab)** | ~25 ms | < 500 ms | **PASS** |
| **Peak Memory Footprint (Node.js Heap)** | ~68 MB | < 250 MB | **PASS** |
| **Request Throughput** | 50 req/sec (adaptive limit) | Bounded | **PASS** |
| **Artifact Generation Latency** | < 5 ms | < 50 ms | **PASS** |

## 3. Resource Governance

- **Rate Limiting**: Enforced via `AdaptiveRateLimiter` token bucket.
- **Queue Limits**: Maximum 5 concurrent active probe tasks to prevent target DoS.
- **Memory Limits**: AST trees and response snippets are bounded to 200KB per entity.
