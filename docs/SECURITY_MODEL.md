# DontTrust Scanner Self-Security Model

## Self-Protection Principles

As a security scanning platform, DontTrust is engineered to prevent exploitation or abuse via malicious target responses or hostile inputs.

Implemented in:
- SSRF Guard: [`SSRFProtection`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/scope-engine/src/ssrf.ts)
- Scope Enforcement: [`ScopeEngine`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/scope-engine/src/scope-engine.ts)
- Secret Redactor: [`SecretRedactor`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/common/src/redactor.ts)

## Security Controls

1. **SSRF & Localhost Defense**:
   - `SSRFProtection.isSafeTarget()` verifies target IPs against loopback (`127.0.0.0/8`, `::1`), private RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local metadata addresses (`169.254.169.254`), and CGNAT ranges unless explicitly configured in local lab mode.

2. **Scope Isolation**:
   - Every outgoing HTTP/WebSocket request is checked against strict inclusion and exclusion glob/domain patterns.
   - Cross-origin navigation during browser crawls is terminated.

3. **Safe Parsing & Sandbox Limits**:
   - HTML, XML, and JSON parsers run with external entity resolution disabled (XXE immune).
   - Headless browser instances operate in isolated incognito contexts with disabled file access and bounded script execution timeouts.

4. **Zero Shell/Command Execution on Target Inputs**:
   - Probe payloads never execute OS shell commands or rely on `eval()` on raw target response bodies.
