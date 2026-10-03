# DontTrust Detection Rules & Rule SDK Reference

## 1. Rule Architecture
Every rule in DontTrust extends the abstract `SecurityRule` class defined in `@donttrust/scanner-sdk`.

```typescript
export abstract class SecurityRule {
  abstract readonly metadata: RuleMetadata;
  abstract applicability(context: DetectionContext): boolean;
  abstract detect(context: DetectionContext): Promise<FindingRecord[]>;
  async verify?(context: VerificationContext): Promise<VerificationResult>;
}
```

## 2. Rule Classification Standard
Rules must categorize findings into one of the standard categories:
- `CONFIGURATION`
- `INJECTION`
- `XSS`
- `AUTHENTICATION`
- `AUTHORIZATION`
- `CSRF`
- `CORS`
- `API`
- `GRAPHQL`
- `WEBSOCKET`
- `JAVASCRIPT`
- `INFORMATION_DISCLOSURE`
- `DEPENDENCY`
- `BUSINESS_LOGIC`

## 3. Evidence Quality Principle
- A rule must never emit a finding without capturing concrete evidence.
- Dual categorization of **Severity** and **Confidence** is mandatory.
- Use `SecretRedactor` to sanitize captured HTTP dumps and headers.
