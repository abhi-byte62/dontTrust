# DontTrust: Technical Interview & Architecture Q&A Notes

### Q1: Why did you build an Application Intelligence Model instead of firing raw rules?
*Answer*: Real-world applications have state, client-side routing, authorization boundaries, and interdependent endpoints. Firing raw rules blindly misses complex multi-step flaws (like IDOR/BOLA or client-side DOM XSS) and floods developers with false alarms. Modeling endpoints, parameters, assets, and identity contexts first allows the platform to generate context-aware hypotheses and verify them selectively.

### Q2: How does DontTrust prevent SSRF or pivoting into internal networks?
*Answer*: The `ScopeEngine` runs every candidate URL and redirected destination through `SSRFProtection.isSafeTarget()`. It resolves hostnames and checks the resulting IP against private RFC 1918 blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local metadata addresses (`169.254.169.254`), and CGNAT spaces before the socket connection is created.

### Q3: How do you eliminate false positives during testing?
*Answer*: We utilize a three-stage verification pipeline:
1. Static / Recon generation creates a `SecurityHypothesis` (not a finding).
2. The `DifferentialEngine` collects a non-malicious baseline request.
3. A benign, bounded probe is dispatched and analyzed for reflection or status delta. Only if empirical differential proof succeeds is the hypothesis promoted to a canonical `FindingRecord`.

### Q4: How is secret redaction implemented across the platform?
*Answer*: The `SecretRedactor` is integrated into finding builders, log formatters, and telemetry emitters. It regex-matches Authorization headers, session cookies, AWS keys (`AKIA...`), Stripe keys (`pk_live...`, `sk_live...`), JWT tokens, and passwords, replacing them with sanitized placeholders (`[REDACTED_BEARER_TOKEN]`) before serialization.

### Q5: How do you achieve scan reproducibility?
*Answer*: Finding IDs and graph node IDs are deterministic SHA-256 hashes of canonical invariant properties (`ruleId + host + normalizedPath + parameter`). Dynamic properties (like timestamps and request durations) are separated from the canonical finding fingerprint.
