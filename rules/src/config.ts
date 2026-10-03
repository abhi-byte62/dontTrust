import {
  SecurityRule,
  RuleMetadata,
  DetectionContext
} from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';

export class DebugEndpointExposureRule extends SecurityRule {
  readonly metadata: RuleMetadata = {
    id: 'debug-endpoint-exposure',
    name: 'Sensitive Debug/Config File Exposure',
    category: 'CONFIGURATION',
    defaultSeverity: 'HIGH',
    defaultConfidence: 'HIGH',
    description: 'Sensitive operational files or debug endpoints (e.g. .env, .git/HEAD, /actuator/env, phpinfo) are publicly accessible.',
    remediation: 'Restrict access to sensitive internal paths at the web server / gateway layer.',
    references: ['https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration'],
    mode: 'ACTIVE',
    version: '1.0.0'
  };

  applicability(context: DetectionContext): boolean {
    return context.response.statusCode === 200;
  }

  async detect(context: DetectionContext): Promise<FindingRecord[]> {
    const findings: FindingRecord[] = [];
    const url = context.request.url.toLowerCase();
    const body = context.response.bodySnippet || '';

    // .git/HEAD exposure
    if (url.endsWith('/.git/head') && body.includes('ref: refs/')) {
      findings.push(
        this.createFindingBuilder(context)
          .setClassification(
            'Exposed Git Repository (.git/HEAD)',
            'CONFIGURATION',
            'HIGH',
            'CONFIRMED'
          )
          .setNarrative(
            'The .git/HEAD repository file is accessible, allowing attackers to download the full application source code and commit history.',
            'Complete source code disclosure.',
            this.metadata.remediation,
            this.metadata.references
          )
          .addEvidence({
            type: 'HTTP_EXCHANGE',
            payload: {
              request: { method: context.request.method, url: context.request.url, headers: context.request.headers },
              response: { statusCode: context.response.statusCode, headers: context.response.headers, bodySnippet: body }
            },
            highlightedFragment: body.slice(0, 100)
          })
          .build()
      );
    }

    // .env exposure
    if (url.endsWith('/.env') && (body.includes('DB_PASSWORD') || body.includes('APP_SECRET') || body.includes('API_KEY'))) {
      findings.push(
        this.createFindingBuilder(context)
          .setClassification(
            'Exposed Environment Configuration File (.env)',
            'CONFIGURATION',
            'CRITICAL',
            'CONFIRMED'
          )
          .setNarrative(
            'A production .env environment file is exposed containing secrets and database connection strings.',
            'Direct compromise of backend databases and cloud services.',
            this.metadata.remediation,
            this.metadata.references
          )
          .addEvidence({
            type: 'HTTP_EXCHANGE',
            payload: {
              request: { method: context.request.method, url: context.request.url, headers: context.request.headers },
              response: { statusCode: context.response.statusCode, headers: context.response.headers, bodySnippet: body }
            },
            highlightedFragment: body.slice(0, 150)
          })
          .build()
      );
    }

    return findings;
  }
}
