# DontTrust: Security Rule & Plugin SDK

## Writing a Security Rule

Every security rule implements safe detection, structured evidence capture, and non-destructive differential verification.

### Interface

```typescript
export interface SecurityRule {
  id: string;
  name: string;
  category: FindingCategory;
  severity: Severity;
  description: string;
  
  detect(context: RuleContext): Promise<SecurityHypothesis[]>;
  verify(hypothesis: SecurityHypothesis, verifier: VerificationContext): Promise<FindingRecord | null>;
}
```

### Safety Constraints

Rules must never:
- Execute arbitrary OS shell commands
- Bypass the `ScopeEngine` or `AdaptiveRateLimiter`
- Emit raw passwords, session cookies, or tokens without passing through `SecretRedactor`
- Perform destructive state transitions (e.g. `DELETE /api/users`)
