import { SecurityRule, RuleMetadata, DetectionContext } from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';
export declare class DebugEndpointExposureRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=config.d.ts.map