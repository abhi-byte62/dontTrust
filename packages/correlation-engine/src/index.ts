import { FindingRecord, Severity, Confidence, FindingCategory } from '@donttrust/finding-schema';
import { Hasher } from '@donttrust/common';

export interface AttackChainStep {
  findingId: string;
  ruleId: string;
  title: string;
  assetUrl: string;
  role: 'PREREQUISITE' | 'EXPLOIT_VECTOR' | 'PIVOT' | 'IMPACT_OBJECTIVE';
  description: string;
}

export interface SynthesizedAttackChain {
  chainId: string;
  title: string;
  compositeSeverity: Severity;
  compositeConfidence: Confidence;
  narrative: string;
  steps: AttackChainStep[];
  remediationAdvice: string[];
}

export class CorrelationEngine {
  /**
   * Deterministically deduplicates findings by computing a canonical fingerprint.
   */
  public deduplicate(findings: FindingRecord[]): FindingRecord[] {
    const seen = new Map<string, FindingRecord>();

    for (const f of findings) {
      const rule = f.ruleId;
      const method = f.target?.method || f.httpMethod || 'GET';
      const host = f.target?.host || f.targetHost || '';
      const path = f.target?.path || f.endpointPath || '';
      const param = f.target?.parameter || f.parameterName || '';

      const fpKey = `${rule}:${method.toUpperCase()}:${host.toLowerCase()}:${path}:${param}`;
      const hash = Hasher.sha256(fpKey);

      if (!seen.has(hash)) {
        seen.set(hash, f);
      } else {
        const existing = seen.get(hash)!;
        const confidenceOrder: Confidence[] = [
          Confidence.TENTATIVE,
          Confidence.LOW,
          Confidence.MEDIUM,
          Confidence.HIGH,
          Confidence.CONFIRMED
        ];
        if (confidenceOrder.indexOf(f.confidence) > confidenceOrder.indexOf(existing.confidence)) {
          seen.set(hash, f);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Synthesizes complex multi-stage attack chains with deterministic fingerprints.
   */
  public synthesizeAttackChains(findings: FindingRecord[]): SynthesizedAttackChain[] {
    const deduplicated = this.deduplicate(findings);
    const chains: SynthesizedAttackChain[] = [];
    const seenChainFingerprints = new Set<string>();

    const ssrfFindings = deduplicated.filter(f => f.ruleId === 'SSRF_CANARY_RULE');
    const corsFindings = deduplicated.filter(f => f.ruleId === 'CORS_MISCONFIG_RULE' || f.category === FindingCategory.CORS);
    const authBypassFindings = deduplicated.filter(f => f.ruleId === 'BROKEN_AUTH_RULE' || f.category === FindingCategory.AUTHENTICATION);
    const sqliFindings = deduplicated.filter(f => f.ruleId === 'SQLI_CANARY_RULE');
    const idorFindings = deduplicated.filter(f => f.ruleId === 'IDOR_ACCESS_RULE' || f.category === FindingCategory.AUTHORIZATION);
    const xssFindings = deduplicated.filter(f => f.ruleId === 'XSS_CANARY_RULE' || f.category === FindingCategory.XSS);

    // Chain 1: CORS Misconfiguration + SSRF
    if (corsFindings.length > 0 && ssrfFindings.length > 0) {
      const cors = corsFindings[0];
      const ssrf = ssrfFindings[0];
      const stepIds = [cors.id, ssrf.id].sort();
      const chainFp = Hasher.sha256(`chain-cors-ssrf:${stepIds.join(':')}`);

      if (!seenChainFingerprints.has(chainFp)) {
        seenChainFingerprints.add(chainFp);
        const corsUrl = cors.target?.url || `http://${cors.targetHost}${cors.endpointPath}`;
        const ssrfUrl = ssrf.target?.url || `http://${ssrf.targetHost}${ssrf.endpointPath}`;

        chains.push({
          chainId: `chain-${chainFp.substring(0, 16)}`,
          title: 'Cross-Origin SSRF Chain: Unauthenticated Internal Cloud Pivot',
          compositeSeverity: Severity.CRITICAL,
          compositeConfidence: Confidence.CONFIRMED,
          narrative: `An attacker can leverage the overly permissive CORS policy on ${corsUrl} to execute cross-origin requests from victim browsers, directing the internal proxy at ${ssrfUrl} to interact with internal infrastructure and retrieve sensitive cloud instance metadata.`,
          steps: [
            {
              findingId: cors.id,
              ruleId: cors.ruleId,
              title: cors.title,
              assetUrl: corsUrl,
              role: 'EXPLOIT_VECTOR',
              description: 'Exploit permissive CORS origin reflection to issue authenticated asynchronous requests from external domains.'
            },
            {
              findingId: ssrf.id,
              ruleId: ssrf.ruleId,
              title: ssrf.title,
              assetUrl: ssrfUrl,
              role: 'IMPACT_OBJECTIVE',
              description: 'Pivot into internal VPC subnets and extract metadata service credentials.'
            }
          ],
          remediationAdvice: [
            'Enforce strict Access-Control-Allow-Origin white-listing.',
            'Disable following redirects on the backend HTTP client and enforce bitwise private IP blacklisting.'
          ]
        });
      }
    }

    // Chain 2: Stored/Reflected XSS + Broken Auth / IDOR
    if (xssFindings.length > 0 && (authBypassFindings.length > 0 || idorFindings.length > 0)) {
      const xss = xssFindings[0];
      const targetAuth = authBypassFindings[0] || idorFindings[0];
      const stepIds = [xss.id, targetAuth.id].sort();
      const chainFp = Hasher.sha256(`chain-xss-auth:${stepIds.join(':')}`);

      if (!seenChainFingerprints.has(chainFp)) {
        seenChainFingerprints.add(chainFp);
        const xssUrl = xss.target?.url || `http://${xss.targetHost}${xss.endpointPath}`;
        const authUrl = targetAuth.target?.url || `http://${targetAuth.targetHost}${targetAuth.endpointPath}`;

        chains.push({
          chainId: `chain-${chainFp.substring(0, 16)}`,
          title: 'Composite Account Takeover Chain via Client-Side Injection and Privilege Escalation',
          compositeSeverity: Severity.CRITICAL,
          compositeConfidence: Confidence.CONFIRMED,
          narrative: `Cross-Site Scripting on ${xssUrl} enables payload execution in administrator browser sessions, triggering requests to ${authUrl} to elevate attacker privileges or exfiltrate private user tenant data.`,
          steps: [
            {
              findingId: xss.id,
              ruleId: xss.ruleId,
              title: xss.title,
              assetUrl: xssUrl,
              role: 'EXPLOIT_VECTOR',
              description: 'Inject DOM payload to execute arbitrary JavaScript in victim context.'
            },
            {
              findingId: targetAuth.id,
              ruleId: targetAuth.ruleId,
              title: targetAuth.title,
              assetUrl: authUrl,
              role: 'IMPACT_OBJECTIVE',
              description: 'Invoke privileged API endpoints to reassign credentials or download tenant records.'
            }
          ],
          remediationAdvice: [
            'Enforce strict contextual HTML entity encoding and Content-Security-Policy.',
            'Implement server-side role validation and Anti-CSRF protections on all state-changing endpoints.'
          ]
        });
      }
    }

    // Chain 3: SQL Injection (Direct Critical Impact Chain)
    for (const sqli of sqliFindings) {
      const chainFp = Hasher.sha256(`chain-sqli:${sqli.id}`);
      if (!seenChainFingerprints.has(chainFp)) {
        seenChainFingerprints.add(chainFp);
        const sqliUrl = sqli.target?.url || `http://${sqli.targetHost}${sqli.endpointPath}`;

        chains.push({
          chainId: `chain-${chainFp.substring(0, 16)}`,
          title: 'Direct Database Compromise & Arbitrary Data Exfiltration Chain',
          compositeSeverity: Severity.CRITICAL,
          compositeConfidence: sqli.confidence,
          narrative: `Direct SQL Injection detected at ${sqliUrl} allows full administrative database manipulation, authentication bypass, and potential underlying host command execution.`,
          steps: [
            {
              findingId: sqli.id,
              ruleId: sqli.ruleId,
              title: sqli.title,
              assetUrl: sqliUrl,
              role: 'EXPLOIT_VECTOR',
              description: 'Manipulate parameterized database queries via injection payload.'
            }
          ],
          remediationAdvice: [
            'Use parameterized prepared statements and ORM abstractions without dynamic string concatenation.',
            'Apply least-privilege principles to database service users.'
          ]
        });
      }
    }

    return chains;
  }
}
