import { createHash } from 'node:crypto';

/**
 * Stable fingerprint and hashing utilities for scan assets and finding deduplication.
 */
export class Hasher {
  public static sha256(input: string | Buffer): string {
    return createHash('sha256').update(input).digest('hex');
  }

  public static sha1(input: string | Buffer): string {
    return createHash('sha1').update(input).digest('hex');
  }

  /**
   * Generates a stable finding fingerprint to avoid duplicate reports
   * for the exact same underlying vulnerability across multiple scans.
   */
  public static calculateFindingFingerprint(params: {
    targetHost: string;
    endpointPath: string;
    httpMethod: string;
    parameterName?: string;
    ruleId: string;
    evidenceSignature?: string;
  }): string {
    const raw = [
      params.targetHost.toLowerCase().trim(),
      params.endpointPath.trim(),
      params.httpMethod.toUpperCase().trim(),
      (params.parameterName || '').trim(),
      params.ruleId.trim(),
      (params.evidenceSignature || '').trim()
    ].join('|');
    return Hasher.sha256(raw);
  }
}
