import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app as labApp } from '../../lab/vulnerable-app/src/index.js';
import { createServer } from '../../apps/api/src/server.js';
import { store } from '../../apps/api/src/store.js';
import request from 'supertest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

describe('AegisScan Full-Pipeline Artifact Generation & Scan Reproducibility', () => {
  let labServer: http.Server;
  const labPort = 8082;
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

  it('executes full pipeline, generates scan-result.json, and proves reproducibility', async () => {
    // 1. Setup Project & Target
    const projRes = await request(apiApp)
      .post('/api/v1/projects')
      .send({ name: 'Verification Pipeline Project' });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const targetRes = await request(apiApp)
      .post(`/api/v1/projects/${projectId}/targets`)
      .send({ url: `http://127.0.0.1:${labPort}` });
    expect(targetRes.status).toBe(201);
    const targetId = targetRes.body.id;

    // 2. Execute Scan Run 1
    const scanRes1 = await request(apiApp)
      .post('/api/v1/scans')
      .send({
        projectId,
        targetId,
        targetUrl: `http://127.0.0.1:${labPort}`,
        activeTestingEnabled: true,
        maxRequestsPerSecond: 50,
        maxConcurrency: 10
      });
    expect(scanRes1.status).toBe(202);
    const scanId1 = scanRes1.body.id;

    // Await Scan 1 Completion
    await new Promise((r) => setTimeout(r, 600));

    // Fetch scan 1 details, findings, endpoints, graph, and reports
    const scanRecord1 = store.scans.get(scanId1);
    expect(scanRecord1?.status).toBe('COMPLETED');

    const findings1 = store.findings.get(scanId1) || [];
    const endpoints1 = store.endpoints.get(scanId1) || [];
    const graph1 = store.getOrCreateGraph(scanId1);
    const reports1 = store.reports.get(scanId1);

    expect(findings1.length).toBeGreaterThan(0);
    expect(endpoints1.length).toBeGreaterThan(0);
    expect(graph1.nodes.length).toBeGreaterThan(0);
    expect(reports1?.sarif).toBeDefined();

    // 3. Assemble inspectable scan-result.json artifact
    const scanResultArtifact = {
      scan: scanRecord1,
      target: {
        id: targetId,
        url: `http://127.0.0.1:${labPort}`,
        host: '127.0.0.1',
        port: labPort
      },
      discoveredEndpointsCount: endpoints1.length,
      endpoints: endpoints1,
      attackSurfaceGraph: {
        nodeCount: graph1.nodes.length,
        edgeCount: graph1.edges.length,
        nodes: graph1.nodes,
        edges: graph1.edges
      },
      findingsCount: findings1.length,
      findings: findings1.map(f => ({
        id: f.id,
        ruleId: f.ruleId,
        title: f.title,
        severity: f.severity,
        confidence: f.confidence,
        fingerprint: f.fingerprint,
        target: f.target,
        evidenceCount: f.evidence?.length || 0
      })),
      metrics: {
        durationMs: scanRecord1?.stats?.durationMs,
        requestsTotal: scanRecord1?.stats?.requestsTotal,
        endpointsDiscovered: scanRecord1?.stats?.endpointsDiscovered
      },
      reportsGenerated: Object.keys(reports1 || {})
    };

    const artifactPath = path.join(process.cwd(), 'scan-result.json');
    fs.writeFileSync(artifactPath, JSON.stringify(scanResultArtifact, null, 2), 'utf-8');
    expect(fs.existsSync(artifactPath)).toBe(true);

    // 4. Execute Scan Run 2 (Reproducibility Validation)
    const scanRes2 = await request(apiApp)
      .post('/api/v1/scans')
      .send({
        projectId,
        targetId,
        targetUrl: `http://127.0.0.1:${labPort}`,
        activeTestingEnabled: true,
        maxRequestsPerSecond: 50,
        maxConcurrency: 10
      });
    expect(scanRes2.status).toBe(202);
    const scanId2 = scanRes2.body.id;

    // Await Scan 2 Completion
    await new Promise((r) => setTimeout(r, 600));

    const scanRecord2 = store.scans.get(scanId2);
    expect(scanRecord2?.status).toBe('COMPLETED');

    const findings2 = store.findings.get(scanId2) || [];
    const endpoints2 = store.endpoints.get(scanId2) || [];
    const graph2 = store.getOrCreateGraph(scanId2);

    // Assert Deterministic Reproducibility
    expect(findings1.length).toBe(findings2.length);
    expect(endpoints1.length).toBe(endpoints2.length);
    expect(graph1.nodes.length).toBe(graph2.nodes.length);
    expect(graph1.edges.length).toBe(graph2.edges.length);

    // Assert Identical Finding Fingerprints
    const fingerprints1 = findings1.map(f => f.fingerprint).sort();
    const fingerprints2 = findings2.map(f => f.fingerprint).sort();
    expect(fingerprints1).toEqual(fingerprints2);
  });
});
