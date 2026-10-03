export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Target {
  id: string;
  projectId: string;
  url: string;
  hostname: string;
  defaultProtocol: string;
  defaultPort: number;
  createdAt: string;
}

export interface Scan {
  id: string;
  projectId: string;
  targetId: string;
  targetUrl: string;
  profileName: 'PASSIVE' | 'QUICK' | 'STANDARD' | 'DEEP' | 'API' | 'RESEARCH_LAB' | 'CI';
  status: 'QUEUED' | 'RECONNAISSANCE' | 'CRAWLING' | 'DYNAMIC_ANALYSIS' | 'VULN_DETECTION' | 'VERIFICATION' | 'CORRELATION' | 'GENERATING_REPORT' | 'COMPLETED' | 'FAILED';
  activeTestingEnabled: boolean;
  maxRequestsPerSecond: number;
  startedAt?: string;
  completedAt?: string;
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
}

export interface Finding {
  id: string;
  projectId: string;
  scanId: string;
  fingerprint: string;
  ruleId: string;
  ruleVersion: string;
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence: 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'TENTATIVE';
  status: string;
  targetHost: string;
  endpointPath: string;
  httpMethod: string;
  parameterName?: string;
  authContext?: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
  evidence: Array<{
    id: string;
    type: string;
    payload: any;
    highlightedFragment?: string;
    reproductionInstructions?: string;
    capturedAt: string;
  }>;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface DiscoveredEndpoint {
  id: string;
  scanId: string;
  projectId: string;
  url: string;
  path: string;
  method: string;
  statusCode?: number;
  contentType?: string;
  parameters: string[];
  discoveredAt: string;
}

export interface AttackSurfaceGraph {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    data: Record<string, any>;
    discoveredAt: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    label?: string;
  }>;
}

export interface RuleMeta {
  id: string;
  name: string;
  category: string;
  defaultSeverity: string;
  defaultConfidence: string;
  description: string;
  remediation: string;
  references: string[];
  mode: 'PASSIVE' | 'ACTIVE';
  version: string;
}
