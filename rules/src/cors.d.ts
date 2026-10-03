import { SecurityRule, RuleMetadata, DetectionContext, VerificationContext, VerificationResult } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class CorsOriginReflectionRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
    verify(context: VerificationContext): Promise<VerificationResult>;
}
//# sourceMappingURL=cors.d.ts.map