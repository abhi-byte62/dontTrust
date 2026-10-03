import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app as labApp } from '../../lab/vulnerable-app/src/index.js';
import { createServer } from '../../apps/api/src/server.js';
import { store } from '../../apps/api/src/store.js';
import { ApplicationModel } from '../../packages/application-model/src/application-model.js';
import { JavaScriptAnalyzer } from '../../services/js-analyzer/src/index.js';
import { AuthorizationComparator } from '../../services/auth-analyzer/src/index.js';
import { ApiSchemaParser } from '../../services/api-analyzer/src/index.js';
import { TechnologyFingerprinter } from '../../services/recon-worker/src/index.js';
import { MetricsRegistry } from '../../packages/observability/src/index.js';
import request from 'supertest';
import http from 'node:http';

describe('DontTrust Comprehensive Full-Platform E2E Pipeline', () => {
  let labServer: http.Server;
  const labPort = 8089;
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

  it('runs complete lifecycle: Scope -> Recon -> Crawl -> JS -> API -> State -> Auth -> Hypotheses -> Verification -> Graph -> Report', async () => {
    // 1. Initialize Project & Target
    const projRes = await request(apiApp)
      .post('/api/v1/projects')
      .send({ name: 'Full Platform End-to-End Test Suite' });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const targetUrl = `http://127.0.0.1:${labPort}`;
    const targetRes = await request(apiApp)
      .post(`/api/v1/projects/${projectId}/targets`)
      .send({ url: targetUrl });
    expect(targetRes.status).toBe(201);
    const targetId = targetRes.body.id;

    // 2. Direct Validation of Integrated Subsystems
    // 2a. Recon & Fingerprinting
    const headers = new Headers();
    headers.set('server', 'nginx/1.24.0');
    headers.set('x-powered-by', 'Express');
    const fingerprints = TechnologyFingerprinter.analyzeHeadersAndBody(headers);
    expect(fingerprints.length).toBeGreaterThanOrEqual(2);
    expect(fingerprints.some(f => f.name === 'Nginx')).toBe(true);
    expect(fingerprints.some(f => f.name === 'Express.js')).toBe(true);

    // 2b. JavaScript Source-to-Sink Analysis
    const jsSource = `
      function loadSearch() {
        const params = new URLSearchParams(location.search);
        const term = params.get('q');
        document.getElementById('results').innerHTML = term;
      }
    `;
    const jsResult = JavaScriptAnalyzer.analyze(jsSource, `${targetUrl}/assets/app.js`);
    expect(jsResult.dataFlowSinks.length).toBeGreaterThan(0);
    expect(jsResult.dataFlowSinks[0].source).toBe('location.search');

    // 2c. Multi-Identity Authorization Analysis
    const authResult = AuthorizationComparator.compareIdentities(
      '/admin/settings',
      'GET' as any,
      targetUrl,
      [
        { identityId: 'anon', role: 'ANONYMOUS', headers: {} },
        { identityId: 'user-1', role: 'USER', headers: { authorization: 'Bearer user' } },
        { identityId: 'admin-1', role: 'ADMIN', headers: { authorization: 'Bearer admin' } }
      ],
      [
        { identity: { identityId: 'anon', role: 'ANONYMOUS', headers: {} }, statusCode: 200, body: '{"adminSettings": true}', headers: {} },
        { identity: { identityId: 'user-1', role: 'USER', headers: { authorization: 'Bearer user' } }, statusCode: 200, body: '{"adminSettings": true}', headers: {} },
        { identity: { identityId: 'admin-1', role: 'ADMIN', headers: { authorization: 'Bearer admin' } }, statusCode: 200, body: '{"adminSettings": true}', headers: {} }
      ]
    );
    expect(authResult.hypotheses.length).toBeGreaterThanOrEqual(1);
    expect(authResult.hypotheses.some(h => h.issueType === 'UNAUTHENTICATED_ACCESS' || h.issueType === 'VERTICAL_PRIVILEGE_ESCALATION')).toBe(true);

    // 2d. API Schema Analysis
    const openApiEndpoints = ApiSchemaParser.parseOpenApi({
      openapi: '3.0.0',
      info: { title: 'Test Lab API', version: '1.0.0' },
      paths: {
        '/api/v1/users': {
          get: { summary: 'List Users' },
          post: { summary: 'Create User' }
        }
      }
    }, targetUrl);
    expect(openApiEndpoints.length).toBe(2);

    // 3. Application Model State Machine Verification
    const appModel = new ApplicationModel(targetId, targetUrl);
    const ep = appModel.addEndpoint({
      method: 'GET',
      host: '127.0.0.1',
      path: '/api/v1/orders/101',
      parameters: [],
      observedStatusCodes: [200],
      source: 'OPENAPI'
    });
    const hyp = appModel.addHypothesis({
      ruleId: 'IDOR_HORIZONTAL',
      title: 'Potential BOLA on orders API',
      description: 'Multi-identity probe succeeded accessing cross-tenant resource.',
      target: {
        host: '127.0.0.1',
        port: labPort,
        path: '/api/v1/orders/101'
      },
      supportingEvidence: ['Status 200 returned for unauthorized tenant'],
      confidence: 'HIGH'
    });
    expect(hyp.status).toBe('CANDIDATE');

    const promoted = appModel.updateHypothesisStatus(hyp.id, 'PROMOTED_TO_FINDING', 'Verified via diff probe');
    expect(promoted?.status).toBe('PROMOTED_TO_FINDING');

    // 4. Launch Full Orchestrated Scan
    const scanRes = await request(apiApp)
      .post('/api/v1/scans')
      .send({
        projectId,
        targetId,
        targetUrl,
        activeTestingEnabled: true,
        maxRequestsPerSecond: 50,
        maxConcurrency: 10
      });
    expect(scanRes.status).toBe(202);
    const scanId = scanRes.body.id;

    // Await Scan Pipeline
    await new Promise((r) => setTimeout(r, 650));

    // 5. Verify Output Graph, Findings, and Reporting
    const scanRecord = store.scans.get(scanId);
    expect(scanRecord?.status).toBe('COMPLETED');
    const storedFindings = store.findings.get(scanId);
    expect(storedFindings.length).toBeGreaterThanOrEqual(10);

    const findingsRes = await request(apiApp)
      .get(`/api/v1/scans/${scanId}/findings`);
    expect(findingsRes.status).toBe(200);
    expect(findingsRes.body.length).toBeGreaterThanOrEqual(10);

    // Ensure all findings have reproducible evidence and zero secret leaks
    for (const f of findingsRes.body) {
      expect(f.evidence).toBeDefined();
      expect(f.ruleId).toBeDefined();
      expect(f.fingerprint).toBeDefined();
      expect(JSON.stringify(f)).not.toContain('secret-admin-key');
    }

    // 6. Verify Observability Metrics
    const promMetrics = MetricsRegistry.getInstance().toPrometheusFormat();
    expect(typeof promMetrics).toBe('string');
  });
});
