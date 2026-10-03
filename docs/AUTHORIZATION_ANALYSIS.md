# Multi-Identity Authorization Analysis

## Overview

The Authorization Comparison Engine ([`AuthorizationComparator`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/services/auth-analyzer/src/index.ts)) detects broken access control, IDOR/BOLA, vertical privilege escalation, and unauthenticated endpoint leakage.

## Differential Analysis Methodology

The engine executes comparative security probes across discrete [`IdentityContext`](file:///c:/Users/mrabh/OneDrive/Desktop/bullu/packages/application-model/src/types.ts) configurations:

```text
Identity A (Tenant A User) ───[ Request Resource 123 ]───► Response A (200 OK, Body A)
                                                               │
                                                               ▼ (Differential Normalization)
Identity B (Tenant B User) ───[ Request Resource 123 ]───► Response B (200 OK, Body A) 
                                                               │
                                                               ▼
                                           [ POTENTIAL_HORIZONTAL_IDOR Detected ]
```

### Detection Categories

1. **Horizontal IDOR / BOLA**:
   - Identity B accesses private objects owned by Identity A with matching or equivalent JSON response payloads and HTTP 200/206 status codes.
2. **Vertical Privilege Escalation**:
   - Standard user identity successfully executes administrative or privileged operations (`/admin/*`, `/manage/*`, `/internal/*`).
3. **Unauthenticated Access to Protected Endpoints**:
   - Anonymous caller accesses endpoints with stateful business logic or customer data without valid session tokens.

### Normalization & False-Positive Mitigation

The comparator filters dynamic response volatility:
- Dynamic timestamps and dates (ISO 8601, RFC 2822)
- Ephemeral trace and request IDs (`X-Request-Id`, UUID v4)
- Anti-CSRF nonce tokens and random nonces
