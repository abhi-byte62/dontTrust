import { SecurityRule } from '@donttrust/scanner-sdk';
import { MissingSecurityHeadersRule } from './headers.js';
import { CorsOriginReflectionRule } from './cors.js';
import { InsecureCookieFlagsRule } from './cookies.js';
import { DebugEndpointExposureRule } from './config.js';
import { SqlInjectionDetectionRule } from './injection.js';
import { ReflectedXssDetectionRule } from './xss.js';
import { ExposedSecretsRule } from './secrets.js';

export class RuleRegistry {
  private static rules: SecurityRule[] = [
    new MissingSecurityHeadersRule(),
    new CorsOriginReflectionRule(),
    new InsecureCookieFlagsRule(),
    new DebugEndpointExposureRule(),
    new SqlInjectionDetectionRule(),
    new ReflectedXssDetectionRule(),
    new ExposedSecretsRule()
  ];

  public static getAllRules(): SecurityRule[] {
    return [...RuleRegistry.rules];
  }

  public static getRuleById(id: string): SecurityRule | undefined {
    return RuleRegistry.rules.find(r => r.metadata.id === id);
  }

  public static registerRule(rule: SecurityRule): void {
    if (!RuleRegistry.rules.some(r => r.metadata.id === rule.metadata.id)) {
      RuleRegistry.rules.push(rule);
    }
  }
}
