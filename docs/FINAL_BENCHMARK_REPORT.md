# DontTrust: Final Benchmark & Regression Report

## 1. Benchmark Execution Environment

- **Target Lab**: `lab/vulnerable-app`
- **Suite**: `tests/benchmark/benchmark-matrix.test.ts`
- **Execution Date**: 2026-10-02 / Current Build

## 2. Benchmark Detection Matrix

| Benchmark Route | Target Invariant | Ground Truth | DontTrust Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `GET /api/v1/search?q=` | Reflected XSS | Vulnerable | Detected (`REFLECTED_XSS`) | **PASS** |
| `GET /api/v1/debug-status` | Environment & Info Disclosure | Vulnerable | Detected (`INFO_DISCLOSURE`) | **PASS** |
| `GET /api/v1/orders/:id` | Horizontal BOLA / IDOR | Vulnerable | Detected (`IDOR_HORIZONTAL`) | **PASS** |
| `GET /fetch-image?url=` | Server-Side Request Forgery | Vulnerable | Detected (`SSRF_URL_PARAM`) | **PASS** |
| `GET /admin/stats` | Missing CORS & Exposed Admin | Vulnerable | Detected (`CORS_MISCONFIG`) | **PASS** |
| `GET /assets/app.js` | Client-Side Source-to-Sink DOM XSS | Vulnerable | Detected (`DOM_XSS`) | **PASS** |
| `GET /api/v1/secure-health` | Hardened / Safe Route | Not Vulnerable | Ignored (0 Findings) | **PASS** |

## 3. Statistical Metrics

- **True Positives (TP)**: 6
- **False Positives (FP)**: 0
- **False Negatives (FN)**: 0
- **Precision**: 100%
- **Recall**: 100%
- **F1 Score**: 1.0
- **Redaction Success Rate**: 100% (Zero raw secrets leaked)
