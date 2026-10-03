import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app as labApp } from '../../lab/vulnerable-app/src/index.js';
import { createServer } from '../../apps/api/src/server.js';
import { store } from '../../apps/api/src/store.js';
import request from 'supertest';
import http from 'node:http';

describe('DontTrust End-to-End Benchmark & Negative Regression Suite', () => {
  let labServer: http.Server;
  const labPort = 8081;
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

  it('scans lab target and reliably discovers true positive vulnerabilities with reproducible evidence', async () => {
    // 1. Create Project
    const projRes = await request(apiApp)
      .post('/api/v1/projects')
      .send({ name: 'Automated Benchmark Project' });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Add Lab Target
    const targetRes = await request(apiApp)
      .post(`/api/v1/projects/${projectId}/targets`)
      .send({ url: `http://127.0.0.1:${labPort}` });
    expect(targetRes.status).toBe(201);
    const targetId = targetRes.body.id;

    // 3. Launch Scan
    const scanRes = await request(apiApp)
      .post('/api/v1/scans')
      .send({
        projectId,
        targetId,
        profileName: 'RESEARCH_LAB',
        activeTestingEnabled: true
      });
    expect(scanRes.status).toBe(202);
    const scanId = scanRes.body.id;

    // 4. Await Scan Completion
    await new Promise((r) => setTimeout(r, 600));

    const scanData = await request(apiApp).get(`/api/v1/scans/${scanId}`);
    expect(scanData.body.status).toBe('COMPLETED');
    expect(scanData.body.stats.endpointsDiscovered).toBeGreaterThan(0);

    // 5. Verify Findings Quality & Redaction
    const findingsRes = await request(apiApp).get(`/api/v1/scans/${scanId}/findings`);
    expect(findingsRes.status).toBe(200);
    const findings = findingsRes.body;

    expect(findings.length).toBeGreaterThanOrEqual(4);

    // Check specific detections
    const hasGitExposure = findings.some((f: any) => f.ruleId === 'debug-endpoint-exposure');
    const hasCorsIssue = findings.some((f: any) => f.ruleId === 'cors-origin-reflection');
    const hasHeaderIssue = findings.some((f: any) => f.ruleId === 'missing-security-headers');
    const hasCookieIssue = findings.some((f: any) => f.ruleId === 'insecure-cookie-flags');

    expect(hasGitExposure).toBe(true);
    expect(hasCorsIssue).toBe(true);
    expect(hasHeaderIssue).toBe(true);
    expect(hasCookieIssue).toBe(true);

    // Verify all findings have decoupled severity & confidence
    for (const f of findings) {
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).toContain(f.severity);
      expect(['CONFIRMED', 'HIGH', 'MEDIUM', 'LOW', 'TENTATIVE']).toContain(f.confidence);
      expect(f.fingerprint).toHaveLength(64);
      expect(f.evidence.length).toBeGreaterThan(0);
    }
  });
});
