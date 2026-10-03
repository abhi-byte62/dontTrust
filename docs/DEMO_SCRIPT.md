# DontTrust: Technical Demonstration Script (5–10 Minutes)

This script provides a concise walkthrough for presenting DontTrust to technical interviewers and security leadership.

---

## Step 1: Explain the Core Problem (1 Min)
- *Speaker*: "Traditional web vulnerability scanners spray hundreds of blind payload requests without understanding modern dynamic applications or state transitions. This leads to high false positives and missed authorization bugs. DontTrust approaches assessment like an analyst: Discover $\rightarrow$ Model $\rightarrow$ Hypothesize $\rightarrow$ Safely Verify $\rightarrow$ Correlate."

## Step 2: Show the Monorepo & Architecture (1 Min)
- Show `packages/application-model`, `services/recon-worker`, `services/js-analyzer`, `services/auth-analyzer`, and `packages/differential-engine`.
- Highlight deterministic SHA-256 entity IDs and secret redaction guards.

## Step 3: Start the Benchmark Lab & API (1 Min)
```bash
# Terminal 1: Vulnerable Lab
npm run start -w @aegisscan/vulnerable-lab

# Terminal 2: API Gateway
npm run dev -w @aegisscan/api
```

## Step 4: Run a Controlled Scan via CLI (2 Min)
```bash
npm run cli -- scan http://127.0.0.1:8080 --active
```
- Observe the structured pipeline output:
  1. Scope validation (SSRF loopback protection).
  2. Reconnaissance (Nginx, Express.js fingerprinted).
  3. Crawl & Discovery (`/api/v1/search`, `/api/v1/orders/101`, `/assets/app.js`).
  4. Multi-identity authorization probe (BOLA on orders API).
  5. JS AST source-to-sink DOM XSS detection.
  6. Differential verification (reflection and status diffs).
  7. Deterministic report generation.

## Step 5: Explore the UI Dashboard & Graph (2 Min)
- Open `http://localhost:5173`.
- Navigate to **Attack Surface Explorer**: Click nodes to show domain $\rightarrow$ endpoint $\rightarrow$ parameter $\rightarrow$ verified finding.
- Open **Finding Evidence Viewer**: Show the sanitized HTTP exchange with redacted tokens and proof snippet.

## Step 6: Verify Regression Matrix & Test Rigor (1 Min)
```bash
npx vitest run tests/benchmark
```
- Demonstrate 100% precision on the benchmark matrix with 0 false positives on the hardened control route (`/api/v1/secure-health`).
