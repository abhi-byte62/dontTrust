import { describe, it, expect } from 'vitest';
import { FindingBuilder } from '../src/index.js';

describe('FindingBuilder & Taxonomy Model', () => {
  it('builds a compliant finding record with decoupled severity and confidence', () => {
    const finding = new FindingBuilder()
      .setProject('proj-123', 'scan-456')
      .setRule('cors-origin-reflection', '1.2.0')
      .setTarget('app.target.local', '/api/userinfo', 'GET', 'apiKey')
      .setClassification('Permissive CORS Access-Control-Allow-Origin', 'CORS', 'HIGH', 'CONFIRMED')
      .setNarrative(
        'Server reflects arbitrary Origin headers with credentials allowed.',
        'Enables unauthorized cross-origin data extraction.',
        'Validate Origin headers against a strict whitelist.'
      )
      .addEvidence({
        type: 'HTTP_EXCHANGE',
        payload: {
          request: {
            method: 'GET',
            url: 'https://app.target.local/api/userinfo',
            headers: { Origin: 'https://evil.com' }
          },
          response: {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': 'https://evil.com' }
          }
        },
        reproductionInstructions: 'curl -H "Origin: https://evil.com" https://app.target.local/api/userinfo'
      })
      .build();

    expect(finding.id).toBeDefined();
    expect(finding.fingerprint).toHaveLength(64);
    expect(finding.severity).toBe('HIGH');
    expect(finding.confidence).toBe('CONFIRMED');
    expect(finding.evidence).toHaveLength(1);
    expect(finding.evidence[0].id).toBeDefined();
  });

  it('rejects incomplete findings missing mandatory security fields', () => {
    const builder = new FindingBuilder().setProject('p1', 's1');
    expect(() => builder.build()).toThrow();
  });
});
