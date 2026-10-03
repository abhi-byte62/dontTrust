# Differential Verification Engine

## Purpose & Design

The Verification Engine ([`DifferentialEngine`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/differential-engine/src/differential.ts)) provides bounded, non-destructive empirical verification of candidate vulnerabilities before they can be promoted to verified findings.

## Verification Workflow

1. **Baseline Capture**:
   - A non-malicious baseline request is dispatched to the target endpoint.
   - Response status, latency, headers, and body signature are recorded.

2. **Controlled Probe Execution**:
   - Safe, non-destructive test payloads are injected into target parameters.
   - Payloads are bounded and adhere strictly to scope and rate limits.

3. **Multi-Faceted Differential Comparison**:
   - **Status Code Differential**: Baseline vs Probe response status code changes.
   - **Structural Differential**: DOM tree comparison or JSON schema structure delta.
   - **Reflection Extraction**: Verifies if benign probe tokens are reflected unescaped into response HTML/JSON.
   - **Timing Differential**: Analyzes latency variations with statistical confidence thresholds.

4. **False-Positive Filtering**:
   - Heuristic candidate findings that fail differential proof are rejected or marked as `UNVERIFIED` with reduced confidence scores.
