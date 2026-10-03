import { describe, it, expect } from 'vitest';
import { CorrelationEngine } from '../src/index.js';
import { FindingRecord } from '@aegisscan/finding-schema';

describe('CorrelationEngine', () => {
  const engine = new CorrelationEngine();

  const mockFinding1: FindingRecord = {
    id: 'f-1',
    projectId: 'p-1',
    scanId: 's-1',
    fingerprint: 'fp-1',
    ruleId: 'CORS_MISCONFIG_RULE',
    ruleVersion: '1.0.0',
    title: 'Permissive CORS Header',
    category: 'CORS',
    severity: 'MEDIUM',
    confidence: 'CONFIRMED',
    status: 'OPEN',
    target: {
      url: 'http://app.target.local/api/profile',
      host: 'app.target.local',
      path: '/api/profile',
      method: 'GET'
    },
    targetHost: 'app.target.local',
    endpointPath: '/api/profile',
    httpMethod: 'GET',
    description: 'Permissive CORS',
    impact: 'Cross-origin data access',
    remediation: 'Fix CORS header',
    references: [],
    evidence: [],
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };

  const mockFinding2: FindingRecord = {
    id: 'f-2',
    projectId: 'p-1',
    scanId: 's-1',
    fingerprint: 'fp-2',
    ruleId: 'SSRF_CANARY_RULE',
    ruleVersion: '1.0.0',
    title: 'Server-Side Request Forgery',
    category: 'INJECTION',
    severity: 'HIGH',
    confidence: 'CONFIRMED',
    status: 'OPEN',
    target: {
      url: 'http://app.target.local/fetch',
      host: 'app.target.local',
      path: '/fetch',
      method: 'POST',
      parameter: 'url'
    },
    targetHost: 'app.target.local',
    endpointPath: '/fetch',
    httpMethod: 'POST',
    parameterName: 'url',
    description: 'SSRF vulnerability',
    impact: 'VPC pivoting',
    remediation: 'Block private IPs',
    references: [],
    evidence: [],
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };

  it('deduplicates identical findings prioritizing higher confidence', () => {
    const duplicateTentative: FindingRecord = {
      ...mockFinding1,
      id: 'f-1-dup',
      confidence: 'TENTATIVE'
    };

    const deduplicated = engine.deduplicate([duplicateTentative, mockFinding1]);
    expect(deduplicated.length).toBe(1);
    expect(deduplicated[0].confidence).toBe('CONFIRMED');
  });

  it('synthesizes multi-stage CORS + SSRF attack chains with elevated CRITICAL severity', () => {
    const chains = engine.synthesizeAttackChains([mockFinding1, mockFinding2]);
    expect(chains.length).toBe(1);
    expect(chains[0].compositeSeverity).toBe('CRITICAL');
    expect(chains[0].title).toContain('Cross-Origin SSRF Chain');
    expect(chains[0].steps.length).toBe(2);
  });
});
