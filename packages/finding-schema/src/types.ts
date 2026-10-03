import { Hasher } from '@donttrust/common';
import { HttpMethod } from '@donttrust/protocol-models';

export const Severity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const Confidence = {
  CONFIRMED: 'CONFIRMED',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  TENTATIVE: 'TENTATIVE'
} as const;
export type Confidence = (typeof Confidence)[keyof typeof Confidence];

export const FindingStatus = {
  CANDIDATE: 'CANDIDATE',
  OPEN: 'OPEN',
  VERIFIED: 'VERIFIED',
  CONFIRMED: 'CONFIRMED',
  ACCEPTED_RISK: 'ACCEPTED_RISK',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  RESOLVED: 'RESOLVED',
  REOPENED: 'REOPENED'
} as const;
export type FindingStatus = (typeof FindingStatus)[keyof typeof FindingStatus];

export const FindingCategory = {
  CONFIGURATION: 'CONFIGURATION',
  INJECTION: 'INJECTION',
  XSS: 'XSS',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  CSRF: 'CSRF',
  CORS: 'CORS',
  SSRF: 'SSRF',
  API: 'API',
  GRAPHQL: 'GRAPHQL',
  WEBSOCKET: 'WEBSOCKET',
  JAVASCRIPT: 'JAVASCRIPT',
  INFORMATION_DISCLOSURE: 'INFORMATION_DISCLOSURE',
  DEPENDENCY: 'DEPENDENCY',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC'
} as const;
export type FindingCategory = (typeof FindingCategory)[keyof typeof FindingCategory];

export type EvidenceType =
  | 'HTTP_EXCHANGE'
  | 'DOM_SNIPPET'
  | 'AST_DATAFLOW'
  | 'TIMING_DIFFERENTIAL'
  | 'TLS_CERTIFICATE'
  | 'DNS_RECORD';

export interface HttpEvidencePayload {
  request: {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    body?: string;
  };
  response: {
    statusCode: number;
    headers: Record<string, string | string[]>;
    bodySnippet?: string;
    responseTimeMs?: number;
  };
}

export interface FindingEvidence {
  id: string;
  type: EvidenceType;
  capturedAt: string;
  payload: HttpEvidencePayload | Record<string, unknown>;
  highlightedFragment?: string;
  reproductionInstructions?: string;
}

export interface FindingTarget {
  url?: string;
  host?: string;
  path?: string;
  method?: HttpMethod;
  parameter?: string;
  endpointId?: string;
}

export interface FindingRecord {
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
  target: FindingTarget;
  // Direct compatibility properties
  targetHost: string;
  endpointPath: string;
  httpMethod: string;
  parameterName?: string;
  authContext?: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
  evidence: FindingEvidence[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export type Finding = FindingRecord;

export class FindingBuilder {
  private data: Partial<FindingRecord> = {
    evidence: [],
    references: [],
    status: FindingStatus.CANDIDATE,
    target: {}
  };

  public setProject(projectId: string, scanId: string): this {
    this.data.projectId = projectId;
    this.data.scanId = scanId;
    return this;
  }

  public setRule(ruleId: string, ruleVersion = '1.0.0'): this {
    this.data.ruleId = ruleId;
    this.data.ruleVersion = ruleVersion;
    return this;
  }

  public setTarget(targetHost: string, endpointPath: string, httpMethod: string, parameterName?: string, url?: string): this {
    this.data.targetHost = targetHost;
    this.data.endpointPath = endpointPath;
    this.data.httpMethod = httpMethod.toUpperCase();
    this.data.parameterName = parameterName;
    this.data.target = {
      url: url || `http://${targetHost}${endpointPath}`,
      host: targetHost,
      path: endpointPath,
      method: httpMethod.toUpperCase() as HttpMethod,
      parameter: parameterName
    };
    return this;
  }

  public setClassification(
    title: string,
    category: FindingCategory,
    severity: Severity,
    confidence: Confidence
  ): this {
    this.data.title = title;
    this.data.category = category;
    this.data.severity = severity;
    this.data.confidence = confidence;
    return this;
  }

  public setNarrative(description: string, impact: string, remediation: string, references: string[] = []): this {
    this.data.description = description;
    this.data.impact = impact;
    this.data.remediation = remediation;
    this.data.references = references;
    return this;
  }

  public addEvidence(evidence: Omit<FindingEvidence, 'id' | 'capturedAt'>): this {
    const fullEvidence: FindingEvidence = {
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
      ...evidence
    };
    this.data.evidence = [...(this.data.evidence || []), fullEvidence];
    return this;
  }

  public setAuthContext(context: string): this {
    this.data.authContext = context;
    return this;
  }

  public build(): FindingRecord {
    if (!this.data.projectId || !this.data.scanId) {
      throw new Error('Finding requires projectId and scanId');
    }
    if (!this.data.ruleId || !this.data.title || !this.data.category) {
      throw new Error('Finding requires ruleId, title, and category');
    }
    if (!this.data.targetHost || !this.data.endpointPath || !this.data.httpMethod) {
      throw new Error('Finding requires target host, path, and HTTP method');
    }

    const host = this.data.targetHost;
    const path = this.data.endpointPath;
    const method = this.data.httpMethod;
    const param = this.data.parameterName || '';
    const rule = this.data.ruleId;

    // Stable deterministic finding fingerprint: SHA256(ruleId:method:host:path:param)
    const fingerprint = Hasher.sha256(`${rule}:${method}:${host}:${path}:${param}`);
    const id = `fnd-${fingerprint.substring(0, 16)}`;

    const target: FindingTarget = this.data.target || {
      url: `http://${host}${path}`,
      host,
      path,
      method: method as HttpMethod,
      parameter: param || undefined
    };

    return {
      id,
      projectId: this.data.projectId,
      scanId: this.data.scanId,
      fingerprint,
      ruleId: rule,
      ruleVersion: this.data.ruleVersion || '1.0.0',
      title: this.data.title,
      category: this.data.category,
      severity: this.data.severity || Severity.MEDIUM,
      confidence: this.data.confidence || Confidence.MEDIUM,
      status: this.data.status || FindingStatus.CANDIDATE,
      target,
      targetHost: host,
      endpointPath: path,
      httpMethod: method,
      parameterName: this.data.parameterName,
      authContext: this.data.authContext,
      description: this.data.description || '',
      impact: this.data.impact || '',
      remediation: this.data.remediation || '',
      references: this.data.references || [],
      evidence: this.data.evidence || [],
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };
  }
}
