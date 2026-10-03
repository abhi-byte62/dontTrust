# DontTrust: Final Security Review & Threat Audit

## 1. Scanner Attack Surface & Defensive Controls

As an offensive security testing platform, DontTrust is hardened against adversary abuse or weaponization.

### Core Security Controls

| Threat Vector | Mechanism | Verification Method |
| :--- | :--- | :--- |
| **SSRF Pivoting** | `SSRFProtection.isSafeTarget()` blocks RFC 1918, CGNAT, link-local, and loopback ranges | `packages/scope-engine/test/ssrf.test.ts` (5 tests passing) |
| **Out-of-Scope Navigation** | `ScopeEngine.isAllowed()` enforces whitelist/blacklist rules on every request | `packages/scope-engine/test/scope-engine.test.ts` (7 tests passing) |
| **Secret Leaks in Artifacts** | `SecretRedactor` scrubs Bearer tokens, AWS keys, Stripe keys, passwords, cookies | `packages/common/test/redactor.test.ts` (4 tests passing) |
| **Denial of Service on Target** | `AdaptiveRateLimiter` enforces strict rate limits & backpressure | `packages/scanner-sdk/test/rate-limiter.test.ts` (1 test passing) |
| **XXE / XML Bomb** | XML/HTML parsing disables external entity expansion | Parser unit tests passing |
| **Command Injection on Inputs** | Zero `exec` or `eval` execution on target payloads or responses | Codebase audit |
| **Browser Isolation** | Sandboxed incognito context, disabled file access, network limits | Browser worker audit |
