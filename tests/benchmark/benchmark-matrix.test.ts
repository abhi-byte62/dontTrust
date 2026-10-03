import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app as labApp } from '../../lab/vulnerable-app/src/index.js';
import { createServer } from '../../apps/api/src/server.js';
import { store } from '../../apps/api/src/store.js';
import request from 'supertest';
import http from 'node:http';

describe('DontTrust Regression & Security Benchmark Matrix', () => {
  let labServer: http.Server;
  const labPort = 8083;
  const apiApp = createServer();

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      labServer = labApp.listen(labPort, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      labServer.close(() => resolve());
    });
  });

  it('evaluates detection precision, recall, and false-positive immunity against benchmark lab', async () => {
    // 1. Setup Project & Scope
    const projRes = await request(apiApp)
      .post('/api/v1/projects')
      .send({ name: 'Benchmark Precision Project' });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const targetRes = await request(apiApp)
      .post(`/api/v1/projects/${projectId}/targets`)
      .send({ url: `http://127.0.0.1:${labPort}` });
    expect(targetRes.status).toBe(201);
    const targetId = targetRes.body.id;

    // 2. Launch Benchmark Scan
    const scanRes = await request(apiApp)
      .post('/api/v1/scans')
      .send({
        projectId,
        targetId,
        targetUrl: `http://127.0.0.1:${labPort}`,
        activeTestingEnabled: true,
        maxRequestsPerSecond: 50,
        maxConcurrency: 5
      });
    expect(scanRes.status).toBe(202);
    const scanId = scanRes.body.id;

    // Await complete scan execution
    await new Promise((r) => setTimeout(r, 600));

    const scanRecord = store.scans.get(scanId);
    expect(scanRecord?.status).toBe('COMPLETED');

    const findings = store.findings.get(scanId) || [];

    // 3. Expected True Positive Detections
    const expectedRuleDetections = [
      'cors-origin-reflection',
      'missing-security-headers',
      'insecure-cookie-flags',
      'debug-endpoint-exposure'
    ];

    for (const ruleId of expectedRuleDetections) {
      const found = findings.some(f => f.ruleId === ruleId);
      expect(found).toBe(true);
    }

    // 4. Negative Test: False Positive Immunity Check
    // The hardened /safe-endpoint MUST NOT have false positives
    const safeEndpointFindings = findings.filter(f => f.target.path === '/safe-endpoint');
    expect(safeEndpointFindings.length).toBe(0);

    // 5. Verification Rate Metrics
    const verifiedFindings = findings.filter(f => f.status === 'VERIFIED' || f.confidence === 'CONFIRMED');
    const verificationRate = verifiedFindings.length / findings.length;
    expect(verificationRate).toBeGreaterThan(0.5);

    // 6. Secret Redaction Check
    for (const f of findings) {
      for (const ev of f.evidence) {
        const evStr = JSON.stringify(ev);
        expect(evStr).not.toContain('SuperSecretRootPassword!');
      }
    }
  });
});
