# DontTrust: System Capabilities & Limitations

## Scope of Capabilities

- Deep passive and active reconnaissance of HTTP, WebSocket, and API endpoints.
- Client-side static source-to-sink data-flow modeling for DOM XSS.
- Multi-identity differential probe analysis for IDOR/BOLA and vertical privilege escalation.
- Non-destructive differential verification of injection and configuration flaws.

## Explicit Limitations

- **No Credential Brute-Forcing**: DontTrust does not perform dictionary or brute-force credential guessing attacks.
- **No Destructive Exploits**: Probes are strictly non-destructive and do not attempt denial of service or persistent data destruction.
- **No Binary Decompilation**: Only Web APIs, JavaScript bundles, DOM representations, and HTTP protocols are analyzed.
