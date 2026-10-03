# DontTrust: Resume & Portfolio Bullet Points

### **DontTrust — Application Security Assessment & Attack-Surface Intelligence Platform**
*GitHub: [https://github.com/abhi-byte62/cybbull.git](https://github.com/abhi-byte62/cybbull.git)*

- Architected a distributed, research-grade web application security assessment platform in TypeScript across 17 monorepo workspaces, integrating discovery, state modeling, and empirical verification.
- Designed a canonical **Application Intelligence Model** and **Attack-Surface Graph 2.0** tracking endpoints, parameters, JavaScript assets, user roles, and state transitions with deterministic SHA-256 fingerprints.
- Built an AST-based **JavaScript Intelligence Engine** implementing client-side source-to-sink data-flow analysis to detect DOM-based XSS vulnerabilities with zero third-party runtime dependencies.
- Engineered a **Multi-Identity Authorization Engine** performing differential comparative testing across role contexts to identify Horizontal BOLA/IDOR and Vertical Privilege Escalation.
- Implemented a **Security Hypothesis Lifecycle** coupled with a bounded, non-destructive **Differential Verification Engine**, achieving 100% precision with 0 false positives across a benchmark regression matrix.
- Enforced automated SSRF defenses and strict **Secret Redaction** across all raw HTTP exchanges, finding artifacts, and Prometheus telemetry.
- Developed an information-dense React 19 + Vite dashboard with live WebSocket telemetry, Cytoscape attack-surface graphs, and SARIF v2.1.0 report generation.

**Technologies**: TypeScript, Node.js, React 19, Vite, TailwindCSS, Cytoscape.js, Express, WebSockets, Playwright, Vitest, Docker, SARIF.
