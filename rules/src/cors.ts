import {
  SecurityRule,
  RuleMetadata,
  DetectionContext,
  VerificationContext,
  VerificationResult
} from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';

export class CorsOriginReflectionRule extends SecurityRule {
  readonly metadata: RuleMetadata = {
    id: 'cors-origin-reflection',
    name: 'Permissive CORS Origin Reflection with Credentials',
    category: 'CORS',
    defaultSeverity: 'HIGH',
    defaultConfidence: 'HIGH',
    description: 'The endpoint reflects arbitrary Origin header values in Access-Control-Allow-Origin with Access-Control-Allow-Credentials: true, allowing malicious third-party origins to execute authenticated requests and extract sensitive user data.',
    remediation: 'Implement an explicit whitelist of trusted origins and avoid reflecting untrusted Origin headers directly.',
    references: ['https://portswigger.net/web-security/cors'],
    mode: 'ACTIVE',
    version: '1.1.0'
  };

  applicability(context: DetectionContext): boolean {
    const acao = context.response.headers['access-control-allow-origin'] as string;
    const acac = context.response.headers['access-control-allow-credentials'] as string;
    return Boolean(acao) || Boolean(acac);
  }

  async detect(context: DetectionContext): Promise<FindingRecord[]> {
    const findings: FindingRecord[] = [];
    const acao = (context.response.headers['access-control-allow-origin'] as string || '').trim();
    const acac = (context.response.headers['access-control-allow-credentials'] as string || '').toLowerCase().trim();

    // Check if origin matches or wildcard with credentials
    if (acao === '*' && acac === 'true') {
      const finding = this.createFindingBuilder(context)
        .setClassification(
          'Invalid/Permissive CORS: Wildcard Origin with Credentials',
          'CORS',
          'HIGH',
          'CONFIRMED'
        )
        .setNarrative(
          'Access-Control-Allow-Origin is set to wildcard (*) while Access-Control-Allow-Credentials is true.',
          'Cross-origin attackers can read sensitive data from authenticated browser sessions.',
          this.metadata.remediation,
          this.metadata.references
        )
        .addEvidence({
          type: 'HTTP_EXCHANGE',
          payload: {
            request: {
              method: context.request.method,
              url: context.request.url,
              headers: context.request.headers
            },
            response: {
              statusCode: context.response.statusCode,
              headers: context.response.headers
            }
          },
          highlightedFragment: `Access-Control-Allow-Origin: ${acao}\nAccess-Control-Allow-Credentials: ${acac}`
        })
        .build();

      findings.push(finding);
    }

    return findings;
  }

  override async verify(context: VerificationContext): Promise<VerificationResult> {
    const testOrigin = 'https://donttrust-canary-test.invalid';
    try {
      const res = await context.httpRequester({
        url: context.finding.endpointPath.startsWith('http')
          ? context.finding.endpointPath
          : `https://${context.finding.targetHost}${context.finding.endpointPath}`,
        method: 'GET',
        headers: {
          Origin: testOrigin
        }
      });

      const acao = (res.headers['access-control-allow-origin'] as string || '').trim();
      const acac = (res.headers['access-control-allow-credentials'] as string || '').toLowerCase().trim();

      if (acao === testOrigin && acac === 'true') {
        return {
          verified: true,
          confidence: 'CONFIRMED',
          evidenceFragment: `Reflected Origin: ${acao} with Credentials: ${acac}`,
          reproductionProof: `curl -H "Origin: ${testOrigin}" "${context.finding.endpointPath}"`,
          reason: 'Target dynamically reflected custom canary Origin header with credentials enabled.'
        };
      }
    } catch (err: any) {
      return {
        verified: false,
        confidence: 'LOW',
        reason: `Verification request failed: ${err.message}`
      };
    }

    return {
      verified: false,
      confidence: context.finding.confidence,
      reason: 'Origin reflection could not be reproduced with canary origin.'
    };
  }
}
