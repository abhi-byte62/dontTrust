import { HttpMethod, TechnologyFingerprint } from '@donttrust/protocol-models';

export interface PrioritizedTask {
  endpointId: string;
  url: string;
  method: HttpMethod;
  score: number; // 0 - 100
  priorityTier: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW' | 'P4_INFO';
  reasons: string[];
}

export class ScanTaskPrioritizer {
  private static readonly CRITICAL_PATH_PATTERNS = [
    { pattern: /\/(admin|manage|super|internal)/i, weight: 30, reason: 'Administrative boundary endpoint' },
    { pattern: /\/(auth|login|signin|oauth|token|password)/i, weight: 25, reason: 'Authentication entry point' },
    { pattern: /\/(api|v[0-9]+|graphql)/i, weight: 20, reason: 'High-density API surface' },
    { pattern: /\/(upload|fetch|proxy|download|file)/i, weight: 25, reason: 'High-risk I/O & SSRF vector' },
    { pattern: /\/(user|account|profile|order|payment|invoice)/i, weight: 20, reason: 'Tenant data & IDOR target' }
  ];

  private static readonly SENSITIVE_PARAM_NAMES = [
    'id', 'user_id', 'account_id', 'url', 'redirect', 'target', 'dest', 'callback',
    'query', 'q', 'search', 'role', 'admin', 'token', 'key', 'file', 'path', 'cmd'
  ];

  /**
   * Evaluates an endpoint and returns an explainable priority tier and score.
   */
  public static prioritizeEndpoint(
    url: string,
    method: HttpMethod,
    parameters: string[] = [],
    technologies: TechnologyFingerprint[] = [],
    hasHypothesis: boolean = false
  ): PrioritizedTask {
    const reasons: string[] = [];
    let score = 20; // baseline score

    const parsedPath = new URL(url).pathname;
    const host = new URL(url).hostname;
    const endpointId = `${method}:${host}:${parsedPath}`;

    // 1. Path Criticality Analysis
    for (const item of ScanTaskPrioritizer.CRITICAL_PATH_PATTERNS) {
      if (item.pattern.test(parsedPath)) {
        score += item.weight;
        reasons.push(item.reason);
      }
    }

    // 2. HTTP Method Criticality
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      score += 15;
      reasons.push(`State-changing HTTP ${method} method`);
    }

    // 3. Parameter Sensitivity
    const sensitiveFound = parameters.filter(p => ScanTaskPrioritizer.SENSITIVE_PARAM_NAMES.includes(p.toLowerCase()));
    if (sensitiveFound.length > 0) {
      score += Math.min(25, sensitiveFound.length * 10);
      reasons.push(`Sensitive injection/IDOR parameters observed: ${sensitiveFound.join(', ')}`);
    }

    // 4. Security Hypothesis Bonus
    if (hasHypothesis) {
      score += 25;
      reasons.push('Candidate Security Hypothesis attached to endpoint');
    }

    // Cap score at 100
    score = Math.min(100, score);

    // Determine Tier
    let priorityTier: PrioritizedTask['priorityTier'] = 'P3_LOW';
    if (score >= 80) priorityTier = 'P0_CRITICAL';
    else if (score >= 60) priorityTier = 'P1_HIGH';
    else if (score >= 40) priorityTier = 'P2_MEDIUM';

    if (reasons.length === 0) {
      reasons.push('Standard low-risk read-only endpoint');
    }

    return {
      endpointId,
      url,
      method,
      score,
      priorityTier,
      reasons
    };
  }
}
