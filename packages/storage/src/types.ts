import { Severity, Confidence, FindingStatus, FindingCategory } from '@donttrust/finding-schema';
import { ScopePolicyConfig } from '@donttrust/scope-engine';
import { AuthRole, HttpMethod, NodeType, EdgeType } from '@donttrust/protocol-models';

export interface DbProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbTarget {
  id: string;
  projectId: string;
  url: string;
  hostname: string;
  defaultProtocol: string;
  defaultPort: number;
  createdAt: string;
}

export interface DbScopeRule {
  id: string;
  projectId: string;
  config: ScopePolicyConfig;
  createdAt: string;
}

export interface DbScan {
  id: string;
  projectId: string;
  targetId: string;
  targetUrl: string;
  profileName: string;
  status: string;
  activeTestingEnabled: boolean;
  maxRequestsPerSecond: number;
  maxConcurrency: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  stats: {
    requestsTotal: number;
    requestsBlockedScope: number;
    endpointsDiscovered: number;
    assetsDiscovered: number;
    findingsCount: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    durationMs?: number;
  };
  error?: string;
  errorMessage?: string;
}

export interface DbDiscoveredEndpoint {
  id: string;
  scanId: string;
  projectId: string;
  url: string;
  path: string;
  method: HttpMethod;
  statusCode?: number;
  contentType?: string;
  parameters: string[];
  discoveredAt: string;
}

export interface DbFinding {
  id: string;
  projectId: string;
  scanId: string;
  fingerprint: string;
  ruleId: string;
  ruleVersion: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  status: FindingStatus;
  targetHost: string;
  endpointPath: string;
  httpMethod: string;
  parameterName?: string;
  authContext?: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
}

export interface DbFindingEvidence {
  id: string;
  findingId: string;
  evidenceType: string;
  payload: Record<string, unknown>;
  highlightedFragment?: string;
  reproductionInstructions?: string;
  capturedAt: string;
}

export interface DbAttackSurfaceNode {
  id: string;
  scanId: string;
  nodeType: NodeType;
  label: string;
  data: Record<string, unknown>;
  discoveredAt: string;
}

export interface DbAttackSurfaceEdge {
  id: string;
  scanId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  label?: string;
}

export interface DbScanBaseline {
  id: string;
  projectId: string;
  targetId: string;
  scanId: string;
  name: string;
  createdAt: string;
}

export interface DbScanDiff {
  id: string;
  currentScanId: string;
  baselineScanId: string;
  newFindingsCount: number;
  resolvedFindingsCount: number;
  changedFindingsCount: number;
  diffData: {
    newFindings: DbFinding[];
    resolvedFindings: DbFinding[];
    changedFindings: Array<{ finding: DbFinding; changes: string[] }>;
  };
  createdAt: string;
}
