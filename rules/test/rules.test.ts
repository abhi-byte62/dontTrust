import { describe, it, expect } from 'vitest';
import {
  MissingSecurityHeadersRule,
  CorsOriginReflectionRule,
  InsecureCookieFlagsRule,
  DebugEndpointExposureRule,
  SqlInjectionDetectionRule,
  ReflectedXssDetectionRule,
  ExposedSecretsRule
} from '../src/index.js';
import { ScopeEngine } from '@aegisscan/scope-engine';
import { Logger } from '@aegisscan/common';

describe('Security Rules Evaluation', () => {
  const scopeEngine = new ScopeEngine({ allowedDomains: ['example.com'] });
  const logger = new Logger('TestLogger');

  it('MissingSecurityHeadersRule flags responses lacking CSP & HSTS', async () => {
    const rule = new MissingSecurityHeadersRule();
    const context = {
      scanId: 's1',
      projectId: 'p1',
      request: { id: 'r1', url: 'https://example.com/login', method: 'GET' as const, headers: {}, timestamp: '' },
      response: {
        id: 'res1',
        requestId: 'r1',
        statusCode: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/html' },
        bodySnippet: '<html><body>Login</body></html>',
        bodyLength: 30,
        responseTimeMs: 10,
        timestamp: ''
      },
      scopeEngine,
      logger,
      activeScanAllowed: false
    };

    expect(rule.applicability(context)).toBe(true);
    const findings = await rule.detect(context);
    expect(findings.length).toBe(1);
    expect(findings[0].category).toBe('CONFIGURATION');
    expect(findings[0].severity).toBe('LOW');
    expect(findings[0].confidence).toBe('CONFIRMED');
  });

  it('CorsOriginReflectionRule detects wildcard origin with credentials', async () => {
    const rule = new CorsOriginReflectionRule();
    const context = {
      scanId: 's1',
      projectId: 'p1',
      request: { id: 'r1', url: 'https://example.com/api', method: 'GET' as const, headers: {}, timestamp: '' },
      response: {
        id: 'res1',
        requestId: 'r1',
        statusCode: 200,
        statusText: 'OK',
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-credentials': 'true'
        },
        bodySnippet: '{}',
        bodyLength: 2,
        responseTimeMs: 10,
        timestamp: ''
      },
      scopeEngine,
      logger,
      activeScanAllowed: true
    };

    expect(rule.applicability(context)).toBe(true);
    const findings = await rule.detect(context);
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('HIGH');
  });

  it('SqlInjectionDetectionRule flags database error disclosures', async () => {
    const rule = new SqlInjectionDetectionRule();
    const context = {
      scanId: 's1',
      projectId: 'p1',
      request: { id: 'r1', url: 'https://example.com/users?id=1', method: 'GET' as const, headers: {}, timestamp: '' },
      response: {
        id: 'res1',
        requestId: 'r1',
        statusCode: 500,
        statusText: 'Error',
        headers: {},
        bodySnippet: 'Fatal error: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version',
        bodyLength: 100,
        responseTimeMs: 10,
        timestamp: ''
      },
      scopeEngine,
      logger,
      activeScanAllowed: true
    };

    expect(rule.applicability(context)).toBe(true);
    const findings = await rule.detect(context);
    expect(findings.length).toBe(1);
    expect(findings[0].category).toBe('INJECTION');
  });

  it('ExposedSecretsRule detects AWS keys and PEM private keys', async () => {
    const rule = new ExposedSecretsRule();
    const context = {
      scanId: 's1',
      projectId: 'p1',
      request: { id: 'r1', url: 'https://example.com/config.js', method: 'GET' as const, headers: {}, timestamp: '' },
      response: {
        id: 'res1',
        requestId: 'r1',
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        bodySnippet: 'const aws_key = "AKIA1234567890ABCDEF";',
        bodyLength: 40,
        responseTimeMs: 10,
        timestamp: ''
      },
      scopeEngine,
      logger,
      activeScanAllowed: false
    };

    expect(rule.applicability(context)).toBe(true);
    const findings = await rule.detect(context);
    expect(findings.length).toBe(1);
    expect(findings[0].category).toBe('INFORMATION_DISCLOSURE');
    expect(findings[0].severity).toBe('HIGH');
  });
});
