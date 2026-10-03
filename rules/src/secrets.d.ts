import { SecurityRule, RuleMetadata, DetectionContext } from '@aegisscan/scanner-sdk';
import { FindingRecord } from '@aegisscan/finding-schema';
export declare class ExposedSecretsRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    private static readonly SECRET_PATTERNS;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=secrets.d.ts.map