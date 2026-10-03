import { SecurityRule, RuleMetadata, DetectionContext, VerificationContext, VerificationResult } from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';
export declare class SqlInjectionDetectionRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    private static readonly SQL_ERRORS;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
    verify(context: VerificationContext): Promise<VerificationResult>;
}
//# sourceMappingURL=injection.d.ts.map