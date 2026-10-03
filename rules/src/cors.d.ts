import { SecurityRule, RuleMetadata, DetectionContext, VerificationContext, VerificationResult } from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';
export declare class CorsOriginReflectionRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
    verify(context: VerificationContext): Promise<VerificationResult>;
}
//# sourceMappingURL=cors.d.ts.map