import { describe, it, expect } from 'vitest';
import { ScanStateMachine, JobBroker, JobEnvelope } from '@aegisscan/scanner-sdk';
import { ReconWorker } from '../../services/recon-worker/src/index.js';
import { CrawlerWorker } from '../../services/crawler-worker/src/index.js';
import { JsAnalyzerWorker } from '../../services/js-analyzer/src/index.js';
import { AuthAnalyzerWorker } from '../../services/auth-analyzer/src/index.js';

describe('ScanStateMachine & Lifecycle', () => {
  it('enforces valid transition order from CREATED to COMPLETED', () => {
    const sm = new ScanStateMachine('CREATED');
    expect(sm.getPhase()).toBe('CREATED');

    sm.transition('SCOPE_VALIDATION');
    sm.transition('RECON');
    sm.transition('CRAWLING');
    sm.transition('ATTACK_SURFACE_BUILD');
    sm.transition('PASSIVE_ANALYSIS');
    sm.transition('ACTIVE_ANALYSIS');
    sm.transition('VERIFICATION');
    sm.transition('CORRELATION');
    sm.transition('EVIDENCE_FINALIZATION');
    sm.transition('REPORTING');
    sm.transition('COMPLETED');

    expect(sm.getPhase()).toBe('COMPLETED');
    expect(sm.isTerminal()).toBe(true);
    expect(sm.getHistory().length).toBeGreaterThan(5);
  });

  it('rejects invalid state jumps', () => {
    const sm = new ScanStateMachine('CREATED');
    expect(() => sm.transition('VERIFICATION')).toThrow();
  });
});

describe('JobBroker & Distributed Queue Scheduling', () => {
  it('schedules jobs with strict priority ordering (P0 before P2)', async () => {
    const broker = new JobBroker();

    const jobNormal: JobEnvelope = {
      jobId: 'job-normal',
      scanId: 's1',
      projectId: 'p1',
      targetId: 't1',
      jobType: 'RECON',
      priority: 'P2_NORMAL',
      attempt: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 60000).toISOString(),
      payload: { url: 'http://example.com' }
    };

    const jobCritical: JobEnvelope = {
      jobId: 'job-critical',
      scanId: 's1',
      projectId: 'p1',
      targetId: 't1',
      jobType: 'RECON',
      priority: 'P0_CRITICAL',
      attempt: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 60000).toISOString(),
      payload: { url: 'http://critical.example.com' }
    };

    broker.publish('aegis.recon', jobNormal);
    broker.publish('aegis.recon', jobCritical);

    // Critical job must be consumed first
    const nextJob = broker.consumeNext('aegis.recon');
    expect(nextJob?.jobId).toBe('job-critical');

    const secondJob = broker.consumeNext('aegis.recon');
    expect(secondJob?.jobId).toBe('job-normal');
  });

  it('routes failed jobs to DLQ when max retries are exceeded', async () => {
    const broker = new JobBroker();
    const failingJob: JobEnvelope = {
      jobId: 'failing-job',
      scanId: 's1',
      projectId: 'p1',
      targetId: 't1',
      jobType: 'CRAWL',
      priority: 'P2_NORMAL',
      attempt: 3,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 60000).toISOString(),
      payload: {}
    };

    broker.publish('aegis.crawl', failingJob);

    await expect(
      broker.executeJob('aegis.crawl', 'w1', async () => {
        throw new Error('Connection timeout');
      })
    ).rejects.toThrow();

    expect(broker.getDlqCount()).toBe(1);
  });
});

describe('Decoupled Worker Services Execution', () => {
  it('ReconWorker builds attack surface topology nodes', async () => {
    const worker = new ReconWorker();
    const result = await worker.processJob({
      jobId: 'j1',
      scanId: 's1',
      projectId: 'p1',
      targetId: 't1',
      jobType: 'RECON',
      priority: 'P2_NORMAL',
      attempt: 1,
      maxAttempts: 3,
      createdAt: '',
      deadline: new Date(Date.now() + 60000).toISOString(),
      payload: { targetUrl: 'https://app.target.local:8443' }
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes.some(n => n.type === 'DOMAIN')).toBe(true);
    expect(result.nodes.some(n => n.type === 'PORT')).toBe(true);
  });

  it('CrawlerWorker normalizes canonical query strings and paths', () => {
    const url1 = 'https://example.com/api?b=2&a=1#frag';
    const normalized = CrawlerWorker.normalizeUrl(url1);
    expect(normalized).toBe('https://example.com/api?a=1&b=2');
  });

  it('JsAnalyzerWorker extracts routes and dangerous DOM sinks', async () => {
    const worker = new JsAnalyzerWorker();
    const jsCode = `
      fetch("/api/v1/users");
      const target = "/auth/login";
      document.getElementById("output").innerHTML = userInput;
      eval(dynamicScript);
      const aws_key = "AKIA1234567890ABCDEF";
    `;

    const result = await worker.processJob({
      jobId: 'j2',
      scanId: 's1',
      projectId: 'p1',
      targetId: 't1',
      jobType: 'JS_ANALYSIS',
      priority: 'P2_NORMAL',
      attempt: 1,
      maxAttempts: 3,
      createdAt: '',
      deadline: new Date(Date.now() + 60000).toISOString(),
      payload: { scriptUrl: 'https://example.com/bundle.js', sourceCode: jsCode }
    });

    expect(result.extractedRoutes).toContain('/api/v1/users');
    expect(result.extractedRoutes).toContain('/auth/login');
    expect(result.potentialSinks.some(s => s.type === 'DANGEROUS_EVAL')).toBe(true);
    expect(result.potentialSinks.some(s => s.type === 'DOM_INNER_HTML')).toBe(true);
    expect(result.exposedSecrets.some(s => s.name === 'AWS Access Key ID')).toBe(true);
  });
});
