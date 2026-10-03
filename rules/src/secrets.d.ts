import { SecurityRule, RuleMetadata, DetectionContext } from '@donttrust/scanner-sdk';
import { FindingRecord } from '@donttrust/finding-schema';
export declare class ExposedSecretsRule extends SecurityRule {
    readonly metadata: RuleMetadata;
    private static readonly SECRET_PATTERNS;
    applicability(context: DetectionContext): boolean;
    detect(context: DetectionContext): Promise<FindingRecord[]>;
}
//# sourceMappingURL=secrets.d.ts.map