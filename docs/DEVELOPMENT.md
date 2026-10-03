# AegisScan Development Guide

## Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Python >= 3.11 (optional for ML / static analysis workers)

## Monorepo Architecture
- `packages/common`: Cryptographic hashing, redaction, and logging.
- `packages/finding-schema`: Finding data models, evidence taxonomy, severity/confidence taxonomy.
- `packages/scope-engine`: Scope boundaries, domain regex, and SSRF guardrails.
- `packages/protocol-models`: HTTP, AST, DOM, and Graph data models.
- `packages/scanner-sdk`: Security rule interfaces and rate-limiting token buckets.

## Running Tests
```bash
npm test
```

## Running Builds
```bash
npm run build
```
