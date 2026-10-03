import { SecurityRule } from '@donttrust/scanner-sdk';
export declare class RuleRegistry {
    private static rules;
    static getAllRules(): SecurityRule[];
    static getRuleById(id: string): SecurityRule | undefined;
    static registerRule(rule: SecurityRule): void;
}
//# sourceMappingURL=registry.d.ts.map