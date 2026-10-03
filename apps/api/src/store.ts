import {
  storage,
  DbProject,
  DbTarget,
  DbScopeRule,
  DbScan,
  DbDiscoveredEndpoint,
  DbFinding,
  DbAttackSurfaceNode,
  DbAttackSurfaceEdge
} from '@aegisscan/storage';

export { storage };
export type {
  DbProject,
  DbTarget,
  DbScopeRule,
  DbScan,
  DbDiscoveredEndpoint,
  DbFinding,
  DbAttackSurfaceNode,
  DbAttackSurfaceEdge
};

export type ScanRecord = DbScan;
export type DiscoveredEndpointRecord = DbDiscoveredEndpoint;
export type ProjectRecord = DbProject;
export type TargetRecord = DbTarget;
export type ScopeRuleRecord = DbScopeRule;

export const store = {
  projects: {
    get: (id: string): DbProject | null => storage.getProject(id),
    set: (id: string, val: DbProject): DbProject => storage.createProject(val),
    values: (): DbProject[] => storage.listProjects()
  },
  targets: {
    get: (id: string): DbTarget | null => storage.getTarget(id),
    set: (id: string, val: DbTarget): DbTarget => storage.createTarget(val),
    values: (): DbTarget[] => storage.listTargets()
  },
  scopeRules: {
    get: (projectId: string): DbScopeRule | null => storage.getScopeRule(projectId),
    set: (projectId: string, val: DbScopeRule): DbScopeRule => storage.setScopeRule(val)
  },
  scans: {
    get: (id: string): DbScan | null => storage.getScan(id),
    set: (id: string, val: DbScan): DbScan => storage.createScan(val),
    values: (): DbScan[] => storage.listScans()
  },
  endpoints: {
    get: (scanId: string): DbDiscoveredEndpoint[] => storage.getEndpointsByScan(scanId),
    set: (scanId: string, val: DbDiscoveredEndpoint[]): void => storage.saveEndpoints(val)
  },
  findings: {
    get: (scanId: string): DbFinding[] => storage.getFindingsByScan(scanId),
    set: (scanId: string, val: DbFinding[]): void => storage.saveFindings(val)
  },
  getOrCreateGraph: (scanId: string) => {
    const graph = storage.getAttackSurfaceGraph(scanId);
    return {
      nodes: graph.nodes.map((n: DbAttackSurfaceNode) => ({
        id: n.id,
        type: n.nodeType,
        label: n.label,
        data: n.data,
        discoveredAt: n.discoveredAt
      })),
      edges: graph.edges.map((e: DbAttackSurfaceEdge) => ({
        id: `${e.sourceNodeId}->${e.targetNodeId}`,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        type: e.edgeType,
        label: e.label
      }))
    };
  },
  addGraphNode: (scanId: string, node: any) => {
    storage.addGraphNode({
      id: node.id,
      scanId,
      nodeType: node.type,
      label: node.label,
      data: node.data || {},
      discoveredAt: node.discoveredAt || new Date().toISOString()
    });
  },
  addGraphEdge: (scanId: string, edge: any) => {
    storage.addGraphEdge({
      id: edge.id || `${edge.source}->${edge.target}`,
      scanId,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      edgeType: edge.type,
      label: edge.label
    });
  },
  reports: new Map<string, Record<string, string>>()
};
