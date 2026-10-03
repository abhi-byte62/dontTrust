import { DatabaseDriver } from './database.js';
import {
  DbProject,
  DbTarget,
  DbScopeRule,
  DbScan,
  DbDiscoveredEndpoint,
  DbFinding,
  DbFindingEvidence,
  DbAttackSurfaceNode,
  DbAttackSurfaceEdge,
  DbScanBaseline,
  DbScanDiff
} from './types.js';

export class StorageRepository {
  constructor(private readonly db: DatabaseDriver = new DatabaseDriver()) {
    this.seedDefaultProject();
  }

  private seedDefaultProject(): void {
    const defaultProject: DbProject = {
      id: 'proj-default-lab',
      name: 'Default Security Lab Target',
      slug: 'default-lab',
      description: 'Authorized local laboratory and demo target environment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.createProject(defaultProject);

    const defaultTarget: DbTarget = {
      id: 'target-default-lab',
      projectId: defaultProject.id,
      url: 'http://127.0.0.1:8080',
      hostname: '127.0.0.1',
      defaultProtocol: 'http:',
      defaultPort: 8080,
      createdAt: new Date().toISOString()
    };
    this.createTarget(defaultTarget);

    const defaultScope: DbScopeRule = {
      id: 'scope-default-lab',
      projectId: defaultProject.id,
      config: {
        allowedDomains: ['127.0.0.1', 'localhost', 'app.target.local'],
        excludedDomains: ['billing.target.local'],
        excludedPaths: ['/logout', '/auth/signout', '/admin/delete*'],
        allowPrivateAddresses: true
      },
      createdAt: new Date().toISOString()
    };
    this.setScopeRule(defaultScope);
  }

  // --- PROJECTS ---
  public createProject(project: DbProject): DbProject {
    this.db.insert('projects', project.id, project as any);
    return project;
  }

  public getProject(id: string): DbProject | null {
    return this.db.get('projects', id) as any;
  }

  public listProjects(): DbProject[] {
    return this.db.query('projects') as any;
  }

  // --- TARGETS ---
  public createTarget(target: DbTarget): DbTarget {
    this.db.insert('targets', target.id, target as any);
    return target;
  }

  public listTargets(projectId?: string): DbTarget[] {
    return this.db.query('targets', projectId ? { projectId } : {}) as any;
  }

  public getTarget(id: string): DbTarget | null {
    return this.db.get('targets', id) as any;
  }

  // --- SCOPES ---
  public setScopeRule(scope: DbScopeRule): DbScopeRule {
    this.db.insert('scope_rules', scope.projectId, scope as any);
    return scope;
  }

  public getScopeRule(projectId: string): DbScopeRule | null {
    return this.db.get('scope_rules', projectId) as any;
  }

  // --- SCANS ---
  public createScan(scan: DbScan): DbScan {
    this.db.insert('scans', scan.id, scan as any);
    return scan;
  }

  public getScan(id: string): DbScan | null {
    return this.db.get('scans', id) as any;
  }

  public updateScan(id: string, updates: Partial<DbScan>): DbScan {
    this.db.update('scans', id, updates as any);
    return this.getScan(id)!;
  }

  public listScans(projectId?: string): DbScan[] {
    return this.db.query('scans', projectId ? { projectId } : {}) as any;
  }

  // --- DISCOVERED ENDPOINTS ---
  public saveEndpoints(endpoints: DbDiscoveredEndpoint[]): void {
    for (const ep of endpoints) {
      this.db.insert('discovered_endpoints', ep.id, ep as any);
    }
  }

  public getEndpointsByScan(scanId: string): DbDiscoveredEndpoint[] {
    return this.db.query('discovered_endpoints', { scanId }) as any;
  }

  // --- FINDINGS & EVIDENCE ---
  public saveFindings(findings: DbFinding[]): void {
    for (const f of findings) {
      this.db.insert('findings', f.id, f as any);
    }
  }

  public getFindingsByScan(scanId: string, filter: { severity?: string; confidence?: string; category?: string } = {}): DbFinding[] {
    let results = this.db.query('findings', { scanId }) as any as DbFinding[];
    if (filter.severity) {
      results = results.filter(f => f.severity === filter.severity);
    }
    if (filter.confidence) {
      results = results.filter(f => f.confidence === filter.confidence);
    }
    if (filter.category) {
      results = results.filter(f => f.category === filter.category);
    }
    return results;
  }

  public saveFindingEvidence(evidenceList: DbFindingEvidence[]): void {
    for (const ev of evidenceList) {
      this.db.insert('finding_evidence', ev.id, ev as any);
    }
  }

  public getEvidenceByFinding(findingId: string): DbFindingEvidence[] {
    return this.db.query('finding_evidence', { findingId }) as any;
  }

  // --- ATTACK SURFACE GRAPH ---
  public addGraphNode(node: DbAttackSurfaceNode): void {
    this.db.insert('attack_surface_nodes', node.id, node as any);
  }

  public addGraphEdge(edge: DbAttackSurfaceEdge): void {
    this.db.insert('attack_surface_edges', `${edge.sourceNodeId}->${edge.targetNodeId}`, edge as any);
  }

  public getAttackSurfaceGraph(scanId: string): { nodes: DbAttackSurfaceNode[]; edges: DbAttackSurfaceEdge[] } {
    const nodes = this.db.query('attack_surface_nodes', { scanId }) as any;
    const edges = this.db.query('attack_surface_edges', { scanId }) as any;
    return { nodes, edges };
  }

  // --- BASELINES & REGRESSION DIFFS ---
  public createBaseline(baseline: DbScanBaseline): DbScanBaseline {
    this.db.insert('scan_baselines', baseline.id, baseline as any);
    return baseline;
  }

  public compareScanAgainstBaseline(currentScanId: string, baselineScanId: string): DbScanDiff {
    const currentFindings = this.getFindingsByScan(currentScanId);
    const baselineFindings = this.getFindingsByScan(baselineScanId);

    const baselineMap = new Map<string, DbFinding>(baselineFindings.map(f => [f.fingerprint, f]));
    const currentMap = new Map<string, DbFinding>(currentFindings.map(f => [f.fingerprint, f]));

    const newFindings: DbFinding[] = [];
    const resolvedFindings: DbFinding[] = [];
    const changedFindings: Array<{ finding: DbFinding; changes: string[] }> = [];

    // Find new & changed findings
    for (const curr of currentFindings) {
      const base = baselineMap.get(curr.fingerprint);
      if (!base) {
        newFindings.push(curr);
      } else {
        const changes: string[] = [];
        if (curr.severity !== base.severity) {
          changes.push(`Severity changed from ${base.severity} to ${curr.severity}`);
        }
        if (curr.confidence !== base.confidence) {
          changes.push(`Confidence changed from ${base.confidence} to ${curr.confidence}`);
        }
        if (changes.length > 0) {
          changedFindings.push({ finding: curr, changes });
        }
      }
    }

    // Find resolved findings
    for (const base of baselineFindings) {
      if (!currentMap.has(base.fingerprint)) {
        resolvedFindings.push(base);
      }
    }

    const diff: DbScanDiff = {
      id: `diff-${crypto.randomUUID()}`,
      currentScanId,
      baselineScanId,
      newFindingsCount: newFindings.length,
      resolvedFindingsCount: resolvedFindings.length,
      changedFindingsCount: changedFindings.length,
      diffData: {
        newFindings,
        resolvedFindings,
        changedFindings
      },
      createdAt: new Date().toISOString()
    };

    this.db.insert('scan_diffs', diff.id, diff as any);
    return diff;
  }
}

export const storage = new StorageRepository();
