import { SecurityRule, RuleMetadata, DetectionContext, VerificationContext, VerificationResult } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class SqlInjectionDetectionRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    private static readonly SQL_ERRORS;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
    verify(context: VerificationContext): Promise<VerificationResult>;
}
//# sourceMappingURL=injection.d.ts.map