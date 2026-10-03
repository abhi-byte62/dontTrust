# AegisScan: Threat Model & Security Architecture

## 1. System Boundaries & Assets
AegisScan processes untrusted input from hostile external web applications, parses dynamic JavaScript, follows HTTP redirects, executes headless browser sessions, and persists raw HTTP evidence.

### Critical Assets:
1. **Control Plane Host**: The host server executing the API and database.
2. **Scanner Identity Credentials**: API keys, OAuth tokens, and test user credentials stored in auth profiles.
3. **Internal Network Infrastructure**: Non-public microservices, AWS EC2 metadata endpoints (`169.254.169.254`), and local container bridges.
4. **Researcher Evidence Vault**: Vulnerability reports, raw HTTP snippets, and findings database.

---

## 2. Threat Scenarios & Mitigations

### 2.1 Server-Side Request Forgery (SSRF) via Scan Targets or Redirects
- **Threat**: An attacker creates a scan target or configures an in-scope web server to redirect to `http://169.254.169.254/latest/meta-data/` or `http://10.0.0.1/admin`.
- **Mitigation**:
  - `ScopeEngine` verifies resolved IP addresses before establishing TCP connections.
  - Re-evaluates every 301/302/307/308 redirect location prior to dispatching subsequent HTTP requests.
  - Blocks loopback, private RFC 1918 ranges, link-local, and cloud metadata IPs unless `allowPrivateAddresses` is explicitly configured in isolated lab mode.

### 2.2 Hostile Content & Stored XSS against Scanner Dashboard
- **Threat**: Target web application returns HTML `<script>fetch('/api/v1/projects')</script>` inside page titles, HTTP response headers, or error messages.
- **Mitigation**:
  - React JSX escaping by default with no use of `dangerouslySetInnerHTML` for untrusted target content.
  - UI Content Security Policy (`script-src 'self'`).

### 2.3 AST Parser & Gzip Decompression Denial-of-Service
- **Threat**: Malicious target returns recursive or cyclic JavaScript files or multi-gigabyte compression bombs.
- **Mitigation**:
  - Strict response payload ceiling (5MB maximum per HTTP transaction).
  - Maximum AST recursion depth constraints and execution timeouts.

### 2.4 Headless Browser Sandbox Escape
- **Threat**: Malicious target executes browser zero-day to compromise the worker operating system.
- **Mitigation**:
  - Chromium runs with sandbox enabled, restricted flags, non-root user, and disposable container profiles.
