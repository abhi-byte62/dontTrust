# DontTrust: Continuous Integration (CI) & SARIF Export

## GitHub Actions & CI Pipelines

DontTrust integrates directly into CI/CD pipelines to enforce automated security gates.

### SARIF Generation

Every completed scan exports standard SARIF v2.1.0 output:

```bash
npm run cli -- scan http://127.0.0.1:8080 --format sarif --output results.sarif
```

### Exit Codes

- `0`: Scan completed cleanly; no blocking high/critical findings.
- `1`: Blocking security vulnerabilities identified.
- `2`: System or scope configuration failure.
