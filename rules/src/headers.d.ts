import { SecurityRule, RuleMetadata, DetectionContext } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class MissingSecurityHeadersRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=headers.d.ts.map