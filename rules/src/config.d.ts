import { SecurityRule, RuleMetadata, DetectionContext } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class DebugEndpointExposureRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=config.d.ts.map