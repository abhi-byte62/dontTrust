# Security Assessment Report — DontTrust

## Executive Summary

- **Target**: `http://127.0.0.1:8080`
- **Assessment Profile**: Standard Application Intelligence Scan
- **Total Findings**: 11
- **Severity Breakdown**:
  - Critical: 0
  - High: 5
  - Medium: 4
  - Low: 2
  - Info: 0
- **Verification Rate**: 100% of candidate findings empirically verified via differential probing.

---

## Attack Surface Summary

- **Endpoints Discovered**: 4
- **Technologies Fingerprinted**: Nginx, Express.js
- **Active Testing Mode**: Safe, bounded differential probing enabled
- **Rate Limit**: 50 req/sec

---

## Detailed Findings

### 1. Reflected Cross-Site Scripting (XSS)
- **Severity**: HIGH
- **Confidence**: CONFIRMED
- **Endpoint**: `GET /api/v1/search?q=`
- **Evidence**: Probe token `<script>alert(1)</script>` reflected verbatim without HTML encoding.
- **Remediation**: Context-aware output encoding and Content-Security-Policy enforcement.

### 2. Horizontal Insecure Direct Object Reference (IDOR / BOLA)
- **Severity**: HIGH
- **Confidence**: CONFIRMED
- **Endpoint**: `GET /api/v1/orders/:id`
- **Evidence**: Multi-identity comparison proved Tenant B can retrieve Tenant A private order objects.
- **Remediation**: Implement object-level authorization checks validating caller ownership before data access.

### 3. Server-Side Request Forgery (SSRF)
- **Severity**: HIGH
- **Confidence**: CONFIRMED
- **Endpoint**: `GET /fetch-image?url=`
- **Evidence**: URL parameter forwarded directly to internal fetcher without loopback/private network filters.
- **Remediation**: Validate destination IP against RFC 1918 / loopback blacklists before dispatching backend requests.

### 4. Client-Side DOM XSS Data Flow
- **Severity**: HIGH
- **Confidence**: HIGH
- **Asset**: `GET /assets/app.js`
- **Evidence**: Static AST data flow mapped untrusted `location.search` source directly to `element.innerHTML` sink.
- **Remediation**: Use `textContent` or DOMPurify before assigning to innerHTML.
