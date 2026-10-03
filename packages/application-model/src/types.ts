import { HttpMethod, TechnologyFingerprint } from '@aegisscan/protocol-models';
import { Severity, Confidence, FindingCategory, FindingRecord } from '@aegisscan/finding-schema';

export type DiscoverySource =
  | 'RECON'
  | 'CRAWLER'
  | 'BROWSER'
  | 'JS_ANALYSIS'
  | 'API_SPEC'
  | 'AUTH_ANALYZER'
  | 'DIFFERENTIAL_VERIFIER';

export interface ProvenanceRecord {
  source: DiscoverySource;
  discoveredAt: string;
  evidenceSnippet?: string;
  sourceLocation?: string;
}

export interface AppParameter {
  name: string;
  in: 'query' | 'body' | 'header' | 'path' | 'cookie';
  dataType?: 'string' | 'number' | 'boolean' | 'json' | 'binary';
  observedValues?: string[];
  required?: boolean;
}

export interface AppEndpoint {
  id: string; // Deterministic: `${method}:${host}:${path}`
  url: string;
  host: string;
  path: string;
  method: HttpMethod;
  parameters: AppParameter[];
  authRequired: boolean;
  requiredRole?: string;
  contentType?: string;
  observedStatusCodes: number[];
  provenance: ProvenanceRecord;
}

export interface AppForm {
  id: string;
  pageUrl: string;
  actionUrl: string;
  method: HttpMethod;
  fields: Array<{ name: string; type: string; value?: string; required?: boolean }>;
  provenance: ProvenanceRecord;
}

export interface AppJavaScriptAsset {
  id: string;
  url: string;
  extractedRoutes: string[];
  extractedEndpoints: string[];
  domSinks: Array<{
    sink: string;
    source: string;
    line?: number;
    codeSnippet: string;
  }>;
  potentialSecrets: Array<{
    type: string;
    sanitizedSnippet: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  provenance: ProvenanceRecord;
}

export interface AppIdentityContext {
  id: string; // e.g. 'anonymous', 'user-a', 'user-b', 'admin'
  label: string;
  role: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  permissions: string[];
  accessibleEndpointIds: string[];
}

export interface AppStateNode {
  id: string;
  name: string;
  identityContextId: string;
  url: string;
  domSummaryHash?: string;
}

export interface AppStateTransition {
  fromStateId: string;
  toStateId: string;
  action: string; // e.g. 'click_login', 'submit_form', 'navigate'
  triggerEndpoint?: string;
}

export type HypothesisStatus =
  | 'CANDIDATE'
  | 'INVESTIGATING'
  | 'VERIFIED'
  | 'REFUTED'
  | 'PROMOTED_TO_FINDING';

export interface SecurityHypothesis {
  id: string;
  ruleId: string;
  title: string;
  category: FindingCategory;
  potentialSeverity: Severity;
  initialConfidence: Confidence;
  status: HypothesisStatus;
  target: {
    url: string;
    host: string;
    path: string;
    method?: HttpMethod;
    parameter?: string;
  };
  hypothesisReason: string;
  verificationStrategy: string;
  supportingEvidence: string[];
  refutingEvidence?: string[];
  provenance: ProvenanceRecord;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedApplicationModel {
  targetId: string;
  targetUrl: string;
  host: string;
  technologies: TechnologyFingerprint[];
  endpoints: AppEndpoint[];
  forms: AppForm[];
  javascriptAssets: AppJavaScriptAsset[];
  identities: AppIdentityContext[];
  states: AppStateNode[];
  transitions: AppStateTransition[];
  hypotheses: SecurityHypothesis[];
  findings: FindingRecord[];
  createdAt: string;
  updatedAt: string;
}
