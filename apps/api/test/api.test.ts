import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { store } from '../src/store.js';

describe('DontTrust API Endpoints & Scan Flow', () => {
  const app = createServer();

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
  });

  it('GET /api/v1/projects returns seeded projects', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/projects creates a new project', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .send({ name: 'Alpha Assessment Lab', description: 'Test project' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.slug).toBe('alpha-assessment-lab');
  });

  it('GET /api/v1/rules returns all loaded security rules', async () => {
    const res = await request(app).get('/api/v1/rules');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    expect(res.body.some((r: any) => r.id === 'missing-security-headers')).toBe(true);
  });

  it('POST /api/v1/scans launches a scan and produces findings and graph', async () => {
    const proj = Array.from(store.projects.values())[0];
    const target = Array.from(store.targets.values())[0];

    const scanRes = await request(app)
      .post('/api/v1/scans')
      .send({
        projectId: proj.id,
        targetId: target.id,
        profileName: 'RESEARCH_LAB',
        activeTestingEnabled: true
      });

    expect(scanRes.status).toBe(202);
    const scanId = scanRes.body.id;

    // Allow asynchronous orchestrator to finish
    await new Promise(resolve => setTimeout(resolve, 600));

    const pollRes = await request(app).get(`/api/v1/scans/${scanId}`);
    expect(pollRes.status).toBe(200);
    expect(pollRes.body.status).toBe('COMPLETED');
    expect(pollRes.body.stats.endpointsDiscovered).toBeGreaterThan(0);

    const findingsRes = await request(app).get(`/api/v1/scans/${scanId}/findings`);
    expect(findingsRes.status).toBe(200);
    expect(findingsRes.body.length).toBeGreaterThan(0);

    const graphRes = await request(app).get(`/api/v1/scans/${scanId}/attack-surface`);
    expect(graphRes.status).toBe(200);
    expect(graphRes.body.nodes.length).toBeGreaterThan(0);
    expect(graphRes.body.edges.length).toBeGreaterThan(0);

    const reportRes = await request(app).get(`/api/v1/scans/${scanId}/report?format=json`);
    expect(reportRes.status).toBe(200);
    expect(reportRes.body.scan_id).toBe(scanId);
  });
});
