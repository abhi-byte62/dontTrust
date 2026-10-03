import { Hasher } from '@donttrust/common';
import { TechnologyFingerprint, HttpMethod } from '@donttrust/protocol-models';
import { FindingRecord } from '@donttrust/finding-schema';
import {
  AppEndpoint,
  AppForm,
  AppJavaScriptAsset,
  AppIdentityContext,
  AppStateNode,
  AppStateTransition,
  SecurityHypothesis,
  HypothesisStatus,
  SerializedApplicationModel
} from './types.js';

export class ApplicationModel {
  public readonly targetId: string;
  public readonly targetUrl: string;
  public readonly host: string;
  public readonly createdAt: string;
  public updatedAt: string;

  private technologies = new Map<string, TechnologyFingerprint>();
  private endpoints = new Map<string, AppEndpoint>();
  private forms = new Map<string, AppForm>();
  private javascriptAssets = new Map<string, AppJavaScriptAsset>();
  private identities = new Map<string, AppIdentityContext>();
  private stateNodes = new Map<string, AppStateNode>();
  private stateTransitions: AppStateTransition[] = [];
  private hypotheses = new Map<string, SecurityHypothesis>();
  private findings = new Map<string, FindingRecord>();

  constructor(targetId: string, targetUrl: string) {
    this.targetId = targetId;
    this.targetUrl = targetUrl;
    try {
      this.host = new URL(targetUrl).hostname;
    } catch {
      this.host = 'unknown';
    }
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;

    // Initialize default anonymous identity context
    this.addIdentityContext({
      id: 'anonymous',
      label: 'Unauthenticated Public Visitor',
      role: 'ANONYMOUS',
      headers: {},
      cookies: {},
      permissions: ['PUBLIC_READ'],
      accessibleEndpointIds: []
    });
  }

  public static generateEndpointId(method: HttpMethod, host: string, path: string): string {
    return `${method.toUpperCase()}:${host.toLowerCase()}:${path}`;
  }

  public addTechnology(tech: TechnologyFingerprint): void {
    const key = `${tech.category}:${tech.name.toLowerCase()}`;
    const existing = this.technologies.get(key);
    if (!existing) {
      this.technologies.set(key, tech);
    } else {
      // Merge confidence / evidence
      const confOrder = ['LOW', 'MEDIUM', 'HIGH'];
      if (confOrder.indexOf(tech.confidence) > confOrder.indexOf(existing.confidence)) {
        existing.confidence = tech.confidence;
      }
      if (tech.version && !existing.version) {
        existing.version = tech.version;
      }
      existing.evidence = `${existing.evidence}; ${tech.evidence}`;
    }
    this.updatedAt = new Date().toISOString();
  }

  public listTechnologies(): TechnologyFingerprint[] {
    return Array.from(this.technologies.values());
  }

  public addEndpoint(ep: Omit<AppEndpoint, 'id'>): AppEndpoint {
    const id = ApplicationModel.generateEndpointId(ep.method, ep.host, ep.path);
    const existing = this.endpoints.get(id);

    if (existing) {
      // Merge parameters and status codes
      for (const p of ep.parameters) {
        if (!existing.parameters.some(x => x.name === p.name && x.in === p.in)) {
          existing.parameters.push(p);
        }
      }
      for (const code of ep.observedStatusCodes) {
        if (!existing.observedStatusCodes.includes(code)) {
          existing.observedStatusCodes.push(code);
        }
      }
      if (ep.authRequired !== undefined) {
        existing.authRequired = existing.authRequired || ep.authRequired;
      }
      this.updatedAt = new Date().toISOString();
      return existing;
    }

    const fullEndpoint: AppEndpoint = {
      id,
      ...ep
    };
    this.endpoints.set(id, fullEndpoint);
    this.updatedAt = new Date().toISOString();
    return fullEndpoint;
  }

  public getEndpoint(id: string): AppEndpoint | undefined {
    return this.endpoints.get(id);
  }

  public listEndpoints(): AppEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  public addForm(form: AppForm): void {
    this.forms.set(form.id, form);
    this.updatedAt = new Date().toISOString();
  }

  public listForms(): AppForm[] {
    return Array.from(this.forms.values());
  }

  public addJavaScriptAsset(js: AppJavaScriptAsset): void {
    this.javascriptAssets.set(js.id, js);
    this.updatedAt = new Date().toISOString();
  }

  public listJavaScriptAssets(): AppJavaScriptAsset[] {
    return Array.from(this.javascriptAssets.values());
  }

  public addIdentityContext(ctx: AppIdentityContext): void {
    this.identities.set(ctx.id, ctx);
    this.updatedAt = new Date().toISOString();
  }

  public listIdentities(): AppIdentityContext[] {
    return Array.from(this.identities.values());
  }

  public addStateNode(node: AppStateNode): void {
    this.stateNodes.set(node.id, node);
    this.updatedAt = new Date().toISOString();
  }

  public addStateTransition(transition: AppStateTransition): void {
    this.stateTransitions.push(transition);
    this.updatedAt = new Date().toISOString();
  }

  public listStateTransitions(): AppStateTransition[] {
    return [...this.stateTransitions];
  }

  public addHypothesis(
    hyp: Omit<SecurityHypothesis, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): SecurityHypothesis {
    const rawFp = `${hyp.ruleId}:${hyp.target.host}:${hyp.target.path}:${hyp.target.parameter || ''}`;
    const id = `hyp-${Hasher.sha256(rawFp).substring(0, 16)}`;
    const now = new Date().toISOString();

    const fullHypothesis: SecurityHypothesis = {
      id,
      ...hyp,
      status: 'CANDIDATE',
      createdAt: now,
      updatedAt: now
    };

    this.hypotheses.set(id, fullHypothesis);
    this.updatedAt = now;
    return fullHypothesis;
  }

  public updateHypothesisStatus(
    id: string,
    status: HypothesisStatus,
    evidence?: string
  ): SecurityHypothesis | undefined {
    const hyp = this.hypotheses.get(id);
    if (!hyp) return undefined;

    hyp.status = status;
    hyp.updatedAt = new Date().toISOString();
    if (evidence) {
      if (status === 'REFUTED') {
        hyp.refutingEvidence = [...(hyp.refutingEvidence || []), evidence];
      } else {
        hyp.supportingEvidence.push(evidence);
      }
    }
    this.updatedAt = hyp.updatedAt;
    return hyp;
  }

  public listHypotheses(): SecurityHypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  public promoteHypothesisToFinding(hypothesisId: string, finding: FindingRecord): void {
    const hyp = this.hypotheses.get(hypothesisId);
    if (hyp) {
      hyp.status = 'PROMOTED_TO_FINDING';
      hyp.updatedAt = new Date().toISOString();
    }
    this.findings.set(finding.id, finding);
    this.updatedAt = new Date().toISOString();
  }

  public listFindings(): FindingRecord[] {
    return Array.from(this.findings.values());
  }

  public exportSnapshot(): SerializedApplicationModel {
    return {
      targetId: this.targetId,
      targetUrl: this.targetUrl,
      host: this.host,
      technologies: this.listTechnologies(),
      endpoints: this.listEndpoints(),
      forms: this.listForms(),
      javascriptAssets: this.listJavaScriptAssets(),
      identities: this.listIdentities(),
      states: Array.from(this.stateNodes.values()),
      transitions: this.listStateTransitions(),
      hypotheses: this.listHypotheses(),
      findings: this.listFindings(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  public importSnapshot(snapshot: SerializedApplicationModel): void {
    for (const tech of snapshot.technologies || []) this.addTechnology(tech);
    for (const ep of snapshot.endpoints || []) this.addEndpoint(ep);
    for (const form of snapshot.forms || []) this.addForm(form);
    for (const js of snapshot.javascriptAssets || []) this.addJavaScriptAsset(js);
    for (const id of snapshot.identities || []) this.addIdentityContext(id);
    for (const state of snapshot.states || []) this.addStateNode(state);
    for (const trans of snapshot.transitions || []) this.addStateTransition(trans);
    for (const hyp of snapshot.hypotheses || []) this.hypotheses.set(hyp.id, hyp);
    for (const f of snapshot.findings || []) this.findings.set(f.id, f);
    this.updatedAt = snapshot.updatedAt || new Date().toISOString();
  }
}
