import { MissingSecurityHeadersRule } from './headers.js';
import { CorsOriginReflectionRule } from './cors.js';
import { InsecureCookieFlagsRule } from './cookies.js';
import { DebugEndpointExposureRule } from './config.js';
import { SqlInjectionDetectionRule } from './injection.js';
import { ReflectedXssDetectionRule } from './xss.js';
import { ExposedSecretsRule } from './secrets.js';
export class RuleRegistry {
    static rules = [
        new MissingSecurityHeadersRule(),
        new CorsOriginReflectionRule(),
        new InsecureCookieFlagsRule(),
        new DebugEndpointExposureRule(),
        new SqlInjectionDetectionRule(),
        new ReflectedXssDetectionRule(),
        new ExposedSecretsRule()
    ];
    static getAllRules() {
        return [...RuleRegistry.rules];
    }
    static getRuleById(id) {
        return RuleRegistry.rules.find(r => r.metadata.id === id);
    }
    static registerRule(rule) {
        if (!RuleRegistry.rules.some(r => r.metadata.id === rule.metadata.id)) {
            RuleRegistry.rules.push(rule);
        }
    }
}
//# sourceMappingURL=registry.js.map