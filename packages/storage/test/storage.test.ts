import { describe, it, expect, beforeEach } from 'vitest';
import { StorageRepository, DatabaseDriver } from '../src/index.js';

describe('StorageRepository Relational Persistence & Baselines', () => {
  let repo: StorageRepository;

  beforeEach(() => {
    repo = new StorageRepository(new DatabaseDriver());
  });

  it('creates and lists projects and targets', () => {
    const project = repo.createProject({
      id: 'proj-omega',
      name: 'Omega FinTech Assessment',
      slug: 'omega-fintech',
      description: 'Audit project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    expect(repo.getProject('proj-omega')).toEqual(project);

    const target = repo.createTarget({
      id: 'target-omega-api',
      projectId: 'proj-omega',
      url: 'https://api.omega.local',
      hostname: 'api.omega.local',
      defaultProtocol: 'https:',
      defaultPort: 443,
      createdAt: new Date().toISOString()
    });

    expect(repo.listTargets('proj-omega')).toHaveLength(1);
    expect(repo.getTarget('target-omega-api')).toEqual(target);
  });

  it('manages scan lifecycle state transitions and queries', () => {
    const scan = repo.createScan({
      id: 'scan-101',
      projectId: 'proj-default-lab',
      targetId: 'target-default-lab',
      targetUrl: 'http://127.0.0.1:8080',
      profileName: 'RESEARCH_LAB',
      status: 'QUEUED',
      activeTestingEnabled: true,
      maxRequestsPerSecond: 20,
      maxConcurrency: 5,
      stats: {
        requestsTotal: 0,
        requestsBlockedScope: 0,
        endpointsDiscovered: 0,
        assetsDiscovered: 0,
        findingsCount: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
      }
    });

    expect(scan.status).toBe('QUEUED');

    const updated = repo.updateScan('scan-101', {
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });

    expect(updated.status).toBe('COMPLETED');
    expect(repo.getScan('scan-101')?.status).toBe('COMPLETED');
  });

  it('persists findings and supports severity & confidence filtering', () => {
    repo.saveFindings([
      {
        id: 'f-1',
        projectId: 'proj-1',
        scanId: 'scan-1',
        fingerprint: 'fp-1',
        ruleId: 'cors-origin-reflection',
        ruleVersion: '1.0.0',
        title: 'Permissive CORS',
        category: 'CORS',
        severity: 'HIGH',
        confidence: 'CONFIRMED',
        status: 'VERIFIED',
        targetHost: 'example.com',
        endpointPath: '/api/data',
        httpMethod: 'GET',
        description: 'CORS reflection',
        impact: 'Data leak',
        remediation: 'Whitelist origins',
        references: [],
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      },
      {
        id: 'f-2',
        projectId: 'proj-1',
        scanId: 'scan-1',
        fingerprint: 'fp-2',
        ruleId: 'missing-security-headers',
        ruleVersion: '1.0.0',
        title: 'Missing CSP',
        category: 'CONFIGURATION',
        severity: 'LOW',
        confidence: 'CONFIRMED',
        status: 'OPEN',
        targetHost: 'example.com',
        endpointPath: '/login',
        httpMethod: 'GET',
        description: 'No CSP',
        impact: 'XSS risk',
        remediation: 'Add CSP',
        references: [],
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      }
    ]);

    const highFindings = repo.getFindingsByScan('scan-1', { severity: 'HIGH' });
    expect(highFindings).toHaveLength(1);
    expect(highFindings[0].id).toBe('f-1');

    const confirmedFindings = repo.getFindingsByScan('scan-1', { confidence: 'CONFIRMED' });
    expect(confirmedFindings).toHaveLength(2);
  });

  it('computes differential regressions against baseline scans', () => {
    // Baseline Scan Findings (f-1 and f-2)
    repo.saveFindings([
      {
        id: 'f-1',
        projectId: 'proj-1',
        scanId: 'scan-base',
        fingerprint: 'fp-1',
        ruleId: 'r1',
        ruleVersion: '1.0',
        title: 'Old Bug',
        category: 'XSS',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        status: 'OPEN',
        targetHost: 'target.local',
        endpointPath: '/search',
        httpMethod: 'GET',
        description: '',
        impact: '',
        remediation: '',
        references: [],
        firstSeenAt: '',
        lastSeenAt: ''
      },
      {
        id: 'f-2',
        projectId: 'proj-1',
        scanId: 'scan-base',
        fingerprint: 'fp-2',
        ruleId: 'r2',
        ruleVersion: '1.0',
        title: 'Resolved Bug',
        category: 'CONFIGURATION',
        severity: 'LOW',
        confidence: 'CONFIRMED',
        status: 'OPEN',
        targetHost: 'target.local',
        endpointPath: '/config',
        httpMethod: 'GET',
        description: '',
        impact: '',
        remediation: '',
        references: [],
        firstSeenAt: '',
        lastSeenAt: ''
      }
    ]);

    // Current Scan Findings (f-1 changed severity to HIGH, f-2 resolved, f-3 is brand new)
    repo.saveFindings([
      {
        id: 'f-1-new',
        projectId: 'proj-1',
        scanId: 'scan-curr',
        fingerprint: 'fp-1',
        ruleId: 'r1',
        ruleVersion: '1.0',
        title: 'Old Bug (Escalated)',
        category: 'XSS',
        severity: 'HIGH', // Changed!
        confidence: 'HIGH',
        status: 'OPEN',
        targetHost: 'target.local',
        endpointPath: '/search',
        httpMethod: 'GET',
        description: '',
        impact: '',
        remediation: '',
        references: [],
        firstSeenAt: '',
        lastSeenAt: ''
      },
      {
        id: 'f-3-new',
        projectId: 'proj-1',
        scanId: 'scan-curr',
        fingerprint: 'fp-3',
        ruleId: 'r3',
        ruleVersion: '1.0',
        title: 'Brand New Injection',
        category: 'INJECTION',
        severity: 'CRITICAL',
        confidence: 'CONFIRMED',
        status: 'OPEN',
        targetHost: 'target.local',
        endpointPath: '/api/v2/exec',
        httpMethod: 'POST',
        description: '',
        impact: '',
        remediation: '',
        references: [],
        firstSeenAt: '',
        lastSeenAt: ''
      }
    ]);

    const diff = repo.compareScanAgainstBaseline('scan-curr', 'scan-base');

    expect(diff.newFindingsCount).toBe(1);
    expect(diff.diffData.newFindings[0].fingerprint).toBe('fp-3');

    expect(diff.resolvedFindingsCount).toBe(1);
    expect(diff.diffData.resolvedFindings[0].fingerprint).toBe('fp-2');

    expect(diff.changedFindingsCount).toBe(1);
    expect(diff.diffData.changedFindings[0].finding.fingerprint).toBe('fp-1');
  });
});
