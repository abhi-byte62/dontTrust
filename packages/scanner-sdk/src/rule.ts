import {
  FindingRecord,
  FindingCategory,
  Severity,
  Confidence,
  FindingBuilder
} from '@donttrust/finding-schema';
import { HttpRequestModel, HttpResponseModel } from '@donttrust/protocol-models';
import { ScopeEngine } from '@donttrust/scope-engine';
import { Logger } from '@donttrust/common';

export type ScanMode = 'PASSIVE' | 'ACTIVE';

export interface RuleMetadata {
  id: string;
  name: string;
  category: FindingCategory;
  defaultSeverity: Severity;
  defaultConfidence: Confidence;
  description: string;
  remediation: string;
  references: string[];
  mode: ScanMode;
  version: string;
}

export interface DetectionContext {
  scanId: string;
  projectId: string;
  request: HttpRequestModel;
  response: HttpResponseModel;
  scopeEngine: ScopeEngine;
  logger: Logger;
  activeScanAllowed: boolean;
  httpRequester?: (req: Partial<HttpRequestModel>) => Promise<HttpResponseModel>;
}

export interface VerificationContext {
  finding: FindingRecord;
  scopeEngine: ScopeEngine;
  logger: Logger;
  httpRequester: (req: Partial<HttpRequestModel>) => Promise<HttpResponseModel>;
}

export interface VerificationResult {
  verified: boolean;
  confidence: Confidence;
  evidenceFragment?: string;
  reproductionProof?: string;
  reason: string;
}

export abstract class SecurityRule {
  abstract readonly metadata: RuleMetadata;

  /**
   * Check if rule is applicable to the current HTTP transaction
   */
  abstract applicability(context: DetectionContext): boolean;

  /**
   * Execute passive or active inspection
   */
  abstract detect(context: DetectionContext): Promise<FindingRecord[]>;

  /**
   * Optional verification method called by the verification engine
   */
  async verify(context: VerificationContext): Promise<VerificationResult> {
    return {
      verified: false,
      confidence: context.finding.confidence,
      reason: 'No automated verification handler implemented for this rule'
    };
  }

  protected createFindingBuilder(context: DetectionContext): FindingBuilder {
    const url = new URL(context.request.url);
    return new FindingBuilder()
      .setProject(context.projectId, context.scanId)
      .setRule(this.metadata.id, this.metadata.version)
      .setTarget(url.hostname, url.pathname, context.request.method)
      .setClassification(
        this.metadata.name,
        this.metadata.category,
        this.metadata.defaultSeverity,
        this.metadata.defaultConfidence
      )
      .setNarrative(
        this.metadata.description,
        'Security posture exposure or policy deviation.',
        this.metadata.remediation,
        this.metadata.references
      );
  }
}
