import { SecurityRule, RuleMetadata, DetectionContext } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class InsecureCookieFlagsRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=cookies.d.ts.map