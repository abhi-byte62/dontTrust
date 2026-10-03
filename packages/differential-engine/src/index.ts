import { Hasher } from '@donttrust/common';
import { HttpResponseModel } from '@donttrust/protocol-models';

export interface DifferentialOptions {
  similarityThreshold?: number; // 0.0 - 1.0 (e.g., 0.95 = 95% similar)
  stripDynamicTokens?: boolean;
  ignoredHeaders?: string[];
  timingAnomalyThresholdMs?: number;
}

export interface DifferentialResult {
  isAnomalous: boolean;
  similarityRatio: number;
  statusCodeMatch: boolean;
  structuralMatch: boolean;
  timingDeltaMs: number;
  isTimingAnomaly: boolean;
  contentLengthDelta: number;
  headerDifferences: {
    added: string[];
    removed: string[];
    modified: Array<{ name: string; baselineVal: string; probeVal: string }>;
  };
  normalizedBaselineHash: string;
  normalizedProbeHash: string;
  reflectionFound: boolean;
  details: string[];
}

export class DifferentialEngine {
  private readonly defaultIgnoredHeaders = [
    'date',
    'age',
    'x-request-id',
    'x-runtime',
    'cf-ray',
    'cf-cache-status',
    'server-timing',
    'x-amz-request-id',
    'x-powered-by',
    'etag'
  ];

  public compare(
    baseline: HttpResponseModel,
    probe: HttpResponseModel,
    options: DifferentialOptions = {}
  ): DifferentialResult {
    const ignoredHeaders = new Set([
      ...this.defaultIgnoredHeaders,
      ...(options.ignoredHeaders || []).map(h => h.toLowerCase())
    ]);
    const similarityThreshold = options.similarityThreshold ?? 0.92;
    const timingThreshold = options.timingAnomalyThresholdMs ?? 3000;

    const statusCodeMatch = baseline.statusCode === probe.statusCode;
    const timingDeltaMs = Math.abs(probe.responseTimeMs - baseline.responseTimeMs);
    const isTimingAnomaly = timingDeltaMs >= timingThreshold;

    // 1. Normalize Body Noise
    const baseBody = baseline.bodySnippet || '';
    const probeBody = probe.bodySnippet || '';

    const normBaselineBody = options.stripDynamicTokens !== false 
      ? this.normalizeDynamicTokens(baseBody)
      : baseBody;
    const normProbeBody = options.stripDynamicTokens !== false
      ? this.normalizeDynamicTokens(probeBody)
      : probeBody;

    const normalizedBaselineHash = Hasher.sha256(normBaselineBody);
    const normalizedProbeHash = Hasher.sha256(normProbeBody);

    const contentLengthDelta = normProbeBody.length - normBaselineBody.length;

    // 2. Similarity calculation
    const similarityRatio = this.calculateSimilarity(normBaselineBody, normProbeBody);
    const structuralMatch = this.compareStructure(normBaselineBody, normProbeBody);

    // 3. Header Comparison
    const headerDiff = this.compareHeaders(
      baseline.headers as Record<string, string>,
      probe.headers as Record<string, string>,
      ignoredHeaders
    );

    const details: string[] = [];
    if (!statusCodeMatch) {
      details.push(`Status code shifted from ${baseline.statusCode} to ${probe.statusCode}`);
    }
    if (similarityRatio < similarityThreshold) {
      details.push(`Body similarity ratio ${(similarityRatio * 100).toFixed(1)}% below threshold ${(similarityThreshold * 100).toFixed(1)}%`);
    }
    if (isTimingAnomaly) {
      details.push(`Timing delta ${timingDeltaMs}ms exceeded threshold ${timingThreshold}ms`);
    }
    if (headerDiff.added.length > 0) {
      details.push(`New headers observed: ${headerDiff.added.join(', ')}`);
    }

    const isAnomalous = !statusCodeMatch || similarityRatio < similarityThreshold || isTimingAnomaly;

    return {
      isAnomalous,
      similarityRatio,
      statusCodeMatch,
      structuralMatch,
      timingDeltaMs,
      isTimingAnomaly,
      contentLengthDelta,
      headerDifferences: headerDiff,
      normalizedBaselineHash,
      normalizedProbeHash,
      reflectionFound: false,
      details
    };
  }

  /**
   * Strips nonces, timestamps, random tokens, and UUIDs to avoid false positives
   */
  public normalizeDynamicTokens(content: string): string {
    if (!content) return '';

    return content
      // UUIDs / GUIDs
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '{{UUID}}')
      // ISO Timestamps
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})/g, '{{TIMESTAMP}}')
      // Unix Epoch Timestamps (10 or 13 digits)
      .replace(/\b1[6-9]\d{8,11}\b/g, '{{EPOCH}}')
      // Anti-CSRF / Nonce tokens in HTML
      .replace(/(?:nonce|csrf|_token|authenticity_token)=["'][a-zA-Z0-9_\-+/=]{16,}["']/gi, 'nonce="{{NONCE}}"')
      // Hex/Base64 hashes (32+ chars)
      .replace(/\b[0-9a-fA-F]{32,64}\b/g, '{{HASH}}');
  }

  /**
   * Fast N-gram token similarity calculation (Dice coefficient)
   */
  public calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1.length || !str2.length) return 0.0;

    const n = 3;
    const getTrigrams = (str: string): Set<string> => {
      const set = new Set<string>();
      for (let i = 0; i <= str.length - n; i++) {
        set.add(str.substring(i, i + n));
      }
      return set;
    };

    const set1 = getTrigrams(str1);
    const set2 = getTrigrams(str2);

    if (set1.size === 0 || set2.size === 0) {
      return str1 === str2 ? 1.0 : 0.0;
    }

    let intersection = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersection++;
      }
    }

    return (2.0 * intersection) / (set1.size + set2.size);
  }

  /**
   * Structural DOM/JSON shape comparison
   */
  public compareStructure(str1: string, str2: string): boolean {
    try {
      const j1 = JSON.parse(str1);
      const j2 = JSON.parse(str2);
      return this.compareJsonStructure(j1, j2);
    } catch {
      const extractTags = (html: string) => (html.match(/<\/?([a-zA-Z0-9]+)[^>]*>/g) || []).map(t => t.replace(/<(\/?[a-zA-Z0-9]+).*/, '$1'));
      const tags1 = extractTags(str1).join(',');
      const tags2 = extractTags(str2).join(',');
      return tags1 === tags2;
    }
  }

  private compareJsonStructure(o1: unknown, o2: unknown): boolean {
    if (typeof o1 !== typeof o2) return false;
    if (o1 === null || o2 === null) return o1 === o2;
    if (typeof o1 !== 'object') return true;

    if (Array.isArray(o1) && Array.isArray(o2)) return true;
    if (Array.isArray(o1) || Array.isArray(o2)) return false;

    const keys1 = Object.keys(o1 as Record<string, unknown>).sort();
    const keys2 = Object.keys(o2 as Record<string, unknown>).sort();

    if (keys1.length !== keys2.length) return false;
    return keys1.every((key, idx) => key === keys2[idx]);
  }

  private compareHeaders(
    h1: Record<string, string | string[]>,
    h2: Record<string, string | string[]>,
    ignored: Set<string>
  ) {
    const k1 = Object.keys(h1 || {}).map(k => k.toLowerCase()).filter(k => !ignored.has(k));
    const k2 = Object.keys(h2 || {}).map(k => k.toLowerCase()).filter(k => !ignored.has(k));

    const set1 = new Set(k1);
    const set2 = new Set(k2);

    const added = k2.filter(k => !set1.has(k));
    const removed = k1.filter(k => !set2.has(k));
    const modified: Array<{ name: string; baselineVal: string; probeVal: string }> = [];

    for (const key of set1) {
      if (set2.has(key)) {
        const v1 = String(h1[key] || '');
        const v2 = String(h2[key] || '');
        if (v1 !== v2) {
          modified.push({ name: key, baselineVal: v1, probeVal: v2 });
        }
      }
    }

    return { added, removed, modified };
  }
}
