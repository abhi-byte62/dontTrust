import { describe, it, expect } from 'vitest';
import { ReconWorker, TechnologyFingerprinter } from '../src/index.js';
import { ScopeEngine } from '@donttrust/scope-engine';

describe('ReconWorker & Deep Technology Fingerprinting', () => {
  it('fingerprints multiple technologies from headers and HTML body', () => {
    const headers = new Headers({
      'server': 'nginx/1.24.0',
      'x-powered-by': 'Express',
      'set-cookie': 'sessionid=abc123xyz; Path=/'
    });
    const htmlBody = '<html><head><div id="root" data-reactroot=""></div></head></html>';

    const tech = TechnologyFingerprinter.analyzeHeadersAndBody(headers, htmlBody);
    expect(tech.some(t => t.name === 'Nginx')).toBe(true);
    expect(tech.some(t => t.name === 'Express.js')).toBe(true);
    expect(tech.some(t => t.name === 'React.js')).toBe(true);
  });

  it('runs reconnaissance and builds domain and port topology nodes', async () => {
    const scope = new ScopeEngine({
      allowedDomains: ['127.0.0.1', 'localhost'],
      allowPrivateAddresses: true
    });
    const worker = new ReconWorker(scope);

    const result = await worker.processJob({
      jobId: 'job-1',
      scanId: 'scan-1',
      queue: 'donttrust.recon',
      priority: 0,
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      payload: {
        targetUrl: 'http://127.0.0.1:8080'
      }
    });

    expect(result.nodes.length).toBeGreaterThanOrEqual(2);
    expect(result.nodes.some(n => n.type === 'DOMAIN')).toBe(true);
    expect(result.nodes.some(n => n.type === 'PORT')).toBe(true);
    expect(result.edges.length).toBeGreaterThanOrEqual(1);
  });
});
