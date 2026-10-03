import { SecurityRule, RuleMetadata, DetectionContext, VerificationContext, VerificationResult } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class ReflectedXssDetectionRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
    verify(context: VerificationContext): Promise<VerificationResult>;
}
//# sourceMappingURL=xss.d.ts.map