import { SecurityRule, RuleMetadata, DetectionContext } from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';
export declare class MissingSecurityHeadersRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=headers.d.ts.map