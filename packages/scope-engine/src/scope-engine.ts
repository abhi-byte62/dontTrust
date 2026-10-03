import { isIP } from 'node:net';
import { IpValidator } from './ip-validator.js';

export interface ScopePolicyConfig {
  allowedDomains: string[]; // e.g. ["example.com", "*.example.com"]
  excludedDomains?: string[]; // e.g. ["payments.example.com", "external.example.com"]
  allowedPaths?: string[]; // e.g. ["/api/*", "/dashboard/*"]
  excludedPaths?: string[]; // e.g. ["/logout", "/auth/signout", "/admin/delete*"]
  allowedProtocols?: string[]; // default ["http:", "https:"]
  allowedPorts?: number[]; // default [80, 443, 8080, 8443, 3000, 5000, 8000]
  allowPrivateAddresses?: boolean; // strictly false for prod, true only in controlled lab mode
}

export type ScopeEvaluationResult =
  | { allowed: true; reason: 'IN_SCOPE' }
  | { allowed: false; reason: 'INVALID_URL' | 'UNSUPPORTED_PROTOCOL' | 'BLOCKED_PORT' | 'SSRF_BLOCKED_PRIVATE_IP' | 'DOMAIN_NOT_ALLOWED' | 'DOMAIN_EXCLUDED' | 'PATH_EXCLUDED' | 'PATH_NOT_ALLOWED' };

export class ScopeEngine {
  private readonly allowedDomains: string[];
  private readonly excludedDomains: string[];
  private readonly allowedPaths: RegExp[];
  private readonly excludedPaths: RegExp[];
  private readonly allowedProtocols: Set<string>;
  private readonly allowedPorts: Set<number>;
  private readonly allowPrivateAddresses: boolean;

  constructor(config: ScopePolicyConfig) {
    this.allowedDomains = (config.allowedDomains || []).map(d => d.toLowerCase().trim());
    this.excludedDomains = (config.excludedDomains || []).map(d => d.toLowerCase().trim());
    this.allowedPaths = (config.allowedPaths || []).map(p => this.globToRegex(p));
    this.excludedPaths = (config.excludedPaths || []).map(p => this.globToRegex(p));
    this.allowedProtocols = new Set(config.allowedProtocols || ['http:', 'https:', 'ws:', 'wss:']);
    this.allowedPorts = new Set(config.allowedPorts || [80, 443, 8080, 8443, 3000, 4000, 5000, 8000, 8081, 8082]);
    this.allowPrivateAddresses = config.allowPrivateAddresses ?? false;
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
  }

  private matchDomainRule(host: string, rule: string): boolean {
    const normalizedHost = host.toLowerCase().trim();
    const normalizedRule = rule.toLowerCase().trim();

    if (normalizedRule.startsWith('*.')) {
      const baseDomain = normalizedRule.slice(2);
      return normalizedHost === baseDomain || normalizedHost.endsWith(`.${baseDomain}`);
    }
    return normalizedHost === normalizedRule;
  }

  /**
   * Primary authorization check. Every request, link, or redirect
   * MUST pass through this method before any network connection is formed.
   */
  public evaluate(rawUrl: string): ScopeEvaluationResult {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return { allowed: false, reason: 'INVALID_URL' };
    }

    // 1. Protocol Validation
    if (!this.allowedProtocols.has(parsed.protocol)) {
      return { allowed: false, reason: 'UNSUPPORTED_PROTOCOL' };
    }

    // 2. Port Validation
    const effectivePort = parsed.port ? Number.parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
    if (this.allowedPorts.size > 0 && !this.allowedPorts.has(effectivePort)) {
      return { allowed: false, reason: 'BLOCKED_PORT' };
    }

    const host = parsed.hostname;

    // 3. SSRF & Private IP Guard
    if (!this.allowPrivateAddresses) {
      if (isIP(host) && IpValidator.isDangerousIP(host)) {
        return { allowed: false, reason: 'SSRF_BLOCKED_PRIVATE_IP' };
      }
      if (host === 'localhost' || host.endsWith('.localhost')) {
        return { allowed: false, reason: 'SSRF_BLOCKED_PRIVATE_IP' };
      }
    }

    // 4. Excluded Domains Check
    for (const excluded of this.excludedDomains) {
      if (this.matchDomainRule(host, excluded)) {
        return { allowed: false, reason: 'DOMAIN_EXCLUDED' };
      }
    }

    // 5. Allowed Domains Check
    const isDomainAllowed = this.allowedDomains.some(allowed => this.matchDomainRule(host, allowed));
    if (!isDomainAllowed) {
      return { allowed: false, reason: 'DOMAIN_NOT_ALLOWED' };
    }

    // 6. Excluded Paths Check
    const path = parsed.pathname;
    for (const excludedPathRegex of this.excludedPaths) {
      if (excludedPathRegex.test(path)) {
        return { allowed: false, reason: 'PATH_EXCLUDED' };
      }
    }

    // 7. Allowed Paths Check (if configured)
    if (this.allowedPaths.length > 0) {
      const isPathAllowed = this.allowedPaths.some(regex => regex.test(path));
      if (!isPathAllowed) {
        return { allowed: false, reason: 'PATH_NOT_ALLOWED' };
      }
    }

    return { allowed: true, reason: 'IN_SCOPE' };
  }

  public isAllowed(rawUrl: string): boolean {
    return this.evaluate(rawUrl).allowed;
  }
}
