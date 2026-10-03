import { describe, it, expect } from 'vitest';
import { DifferentialEngine } from '../src/index.js';
import { HttpResponseModel } from '@aegisscan/protocol-models';

describe('DifferentialEngine', () => {
  const engine = new DifferentialEngine();

  const baseResponse: HttpResponseModel = {
    id: 'res-1',
    requestId: 'req-1',
    statusCode: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'date': 'Wed, 21 Oct 2026 07:28:00 GMT',
      'x-request-id': '123e4567-e89b-12d3-a456-426614174000',
      'server': 'Apache/2.4'
    },
    bodySnippet: '<html><body><h1>Welcome User</h1><p nonce="abc123def456xyz999">Time: 2026-10-02T12:00:00Z</p></body></html>',
    bodyLength: 100,
    responseTimeMs: 50,
    timestamp: new Date().toISOString()
  };

  it('normalizes dynamic timestamps, nonces, and request-ids correctly', () => {
    const identicalProbe: HttpResponseModel = {
      ...baseResponse,
      headers: {
        ...baseResponse.headers,
        'date': 'Wed, 21 Oct 2026 07:28:05 GMT',
        'x-request-id': '987f6543-e21b-12d3-a456-426614174999'
      },
      bodySnippet: '<html><body><h1>Welcome User</h1><p nonce="999xyzdef456abc123">Time: 2026-10-02T12:05:00Z</p></body></html>',
      responseTimeMs: 55
    };

    const result = engine.compare(baseResponse, identicalProbe);
    expect(result.isAnomalous).toBe(false);
    expect(result.similarityRatio).toBeGreaterThan(0.98);
    expect(result.statusCodeMatch).toBe(true);
  });

  it('flags status code divergence as an anomaly', () => {
    const errorProbe: HttpResponseModel = {
      ...baseResponse,
      statusCode: 500,
      statusText: 'Internal Server Error',
      bodySnippet: '<html><body><h1>500 Error: Database syntax error near ...</h1></body></html>'
    };

    const result = engine.compare(baseResponse, errorProbe);
    expect(result.isAnomalous).toBe(true);
    expect(result.statusCodeMatch).toBe(false);
    expect(result.details.some(d => d.includes('Status code shifted'))).toBe(true);
  });

  it('flags timing anomalies', () => {
    const slowProbe: HttpResponseModel = {
      ...baseResponse,
      responseTimeMs: 4500
    };

    const result = engine.compare(baseResponse, slowProbe, { timingAnomalyThresholdMs: 3000 });
    expect(result.isAnomalous).toBe(true);
    expect(result.isTimingAnomaly).toBe(true);
    expect(result.timingDeltaMs).toBe(4450);
  });
});
