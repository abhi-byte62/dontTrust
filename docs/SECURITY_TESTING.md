# DontTrust: Security Testing & Fuzzing Guide

## Test Strategy

1. **Unit & Integration Testing**:
   - Every package contains comprehensive unit tests verifying error boundaries, input sanitization, and deterministic hashing.

2. **Negative Regression Testing**:
   - `tests/benchmark/benchmark-matrix.test.ts` validates that hardened endpoints produce zero false positives.

3. **Adversarial Resilience**:
   - URL parsing, HTML parsing, and JSON decoding are tested against malformed payloads and large inputs.
