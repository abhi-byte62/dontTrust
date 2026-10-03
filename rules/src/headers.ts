import {
  SecurityRule,
  RuleMetadata,
  DetectionContext
} from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';

export class MissingSecurityHeadersRule extends SecurityRule {
  readonly metadata: RuleMetadata = {
    id: 'missing-security-headers',
    name: 'Missing Crucial HTTP Security Headers',
    category: 'CONFIGURATION',
    defaultSeverity: 'LOW',
    defaultConfidence: 'CONFIRMED',
    description: 'The server response lacks essential defense-in-depth security headers such as Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, or X-Frame-Options.',
    remediation: 'Configure the web server or reverse proxy to supply strict CSP, HSTS with preload, X-Content-Type-Options: nosniff, and frame-ancestors directives.',
    references: ['https://owasp.org/www-project-secure-headers/'],
    mode: 'PASSIVE',
    version: '1.0.0'
  };

  applicability(context: DetectionContext): boolean {
    const contentType = (context.response.headers['content-type'] as string || '').toLowerCase();
    return contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
  }

  async detect(context: DetectionContext): Promise<FindingRecord[]> {
    const findings: FindingRecord[] = [];
    const headers = Object.fromEntries(
      Object.entries(context.response.headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    const missingHeaders: string[] = [];

    if (!headers['content-security-policy']) {
      missingHeaders.push('Content-Security-Policy');
    }
    if (!headers['strict-transport-security'] && context.request.url.startsWith('https://')) {
      missingHeaders.push('Strict-Transport-Security');
    }
    if (!headers['x-content-type-options']) {
      missingHeaders.push('X-Content-Type-Options: nosniff');
    }
    if (!headers['x-frame-options'] && !headers['content-security-policy']) {
      missingHeaders.push('X-Frame-Options');
    }

    if (missingHeaders.length > 0) {
      const builder = this.createFindingBuilder(context)
        .setClassification(
          `Missing Security Headers: ${missingHeaders.slice(0, 2).join(', ')}${missingHeaders.length > 2 ? ' (+ more)' : ''}`,
          'CONFIGURATION',
          'LOW',
          'CONFIRMED'
        )
        .setNarrative(
          `The response for ${context.request.url} omits the following security headers: ${missingHeaders.join(', ')}.`,
          'Increases susceptibility to clickjacking, MIME confusion, and cross-site scripting attacks.',
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
              headers: context.response.headers,
              bodySnippet: context.response.bodySnippet?.slice(0, 200)
            }
          },
          highlightedFragment: `Missing: ${missingHeaders.join(', ')}`
        });

      findings.push(builder.build());
    }

    return findings;
  }
}
