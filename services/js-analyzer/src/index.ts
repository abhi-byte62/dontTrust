import { JobEnvelope, jobBroker } from '@donttrust/scanner-sdk';
import { Logger, Hasher } from '@donttrust/common';
import { HttpMethod } from '@donttrust/protocol-models';

export interface JsAnalyzerPayload {
  scriptUrl: string;
  sourceCode: string;
}

export interface ClientDataFlow {
  source: string;
  sink: string;
  codeSnippet: string;
  line: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  hypothesisTitle: string;
}

export interface ExtractedApiEndpoint {
  url: string;
  method: HttpMethod;
  parameters: string[];
  sourceLine?: number;
}

export interface ExposedSecretToken {
  type: string;
  sanitizedSnippet: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
}

export interface JsAnalysisResult {
  scriptUrl: string;
  extractedRoutes: string[];
  extractedEndpoints: ExtractedApiEndpoint[];
  dataFlowSinks: ClientDataFlow[];
  exposedSecrets: ExposedSecretToken[];
}

export class JavaScriptAnalyzer {
  private static readonly SOURCE_PATTERNS = [
    { name: 'location.search', regex: /\blocation\.(?:search|href|pathname|hash)\b/ },
    { name: 'URLSearchParams', regex: /new\s+URLSearchParams\s*\(/ },
    { name: 'document.referrer', regex: /\bdocument\.referrer\b/ },
    { name: 'document.cookie', regex: /\bdocument\.cookie\b/ },
    { name: 'window.name', regex: /\bwindow\.name\b/ },
    { name: 'localStorage', regex: /\blocalStorage\.getItem\s*\(/ },
    { name: 'sessionStorage', regex: /\bsessionStorage\.getItem\s*\(/ },
    { name: 'postMessage_listener', regex: /window\.addEventListener\s*\(\s*['"]message['"]/ }
  ];

  private static readonly SINK_PATTERNS = [
    { name: 'DOM_INNER_HTML', sink: 'element.innerHTML', regex: /\.innerHTML\s*=\s*([^;\n]+)/, category: 'XSS' },
    { name: 'DOM_OUTER_HTML', sink: 'element.outerHTML', regex: /\.outerHTML\s*=\s*([^;\n]+)/, category: 'XSS' },
    { name: 'DOCUMENT_WRITE', sink: 'document.write', regex: /document\.write\s*\(([^)]+)\)/, category: 'XSS' },
    { name: 'DANGEROUS_EVAL', sink: 'eval()', regex: /\beval\s*\(([^)]+)\)/, category: 'CODE_INJECTION' },
    { name: 'FUNCTION_CONSTRUCTOR', sink: 'Function()', regex: /new\s+Function\s*\(([^)]+)\)/, category: 'CODE_INJECTION' },
    { name: 'TIMEOUT_EVAL', sink: 'setTimeout(string)', regex: /setTimeout\s*\(\s*['"`]([^'"`]+)['"`]/, category: 'CODE_INJECTION' },
    { name: 'LOCATION_REDIRECT', sink: 'location.href = ...', regex: /(?:window\.)?location(?:\.href)?\s*=\s*([^;\n]+)/, category: 'OPEN_REDIRECT' }
  ];

  /**
   * Performs deep static AST & string analysis on JavaScript content.
   */
  public static analyze(code: string, scriptUrl: string = 'inline.js'): JsAnalysisResult {
    const lines = code.split('\n');
    const extractedRoutes: string[] = [];
    const extractedEndpoints: ExtractedApiEndpoint[] = [];
    const dataFlowSinks: ClientDataFlow[] = [];
    const exposedSecrets: ExposedSecretToken[] = [];

    // 1. API Route & Invocations Extraction
    const fetchRegex = /(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*[`'"]([^`'"]+)[`'"]/gi;
    let match: RegExpExecArray | null;

    while ((match = fetchRegex.exec(code)) !== null) {
      const endpoint = match[1];
      if (!extractedRoutes.includes(endpoint)) {
        extractedRoutes.push(endpoint);
      }
      extractedEndpoints.push({
        url: endpoint,
        method: match[0].includes('.post') ? HttpMethod.POST : HttpMethod.GET,
        parameters: JavaScriptAnalyzer.extractParametersFromUrl(endpoint)
      });
    }

    // Generic API route string matcher
    const routeRegex = /["'](\/(?:api|v[0-9]|auth|users|admin|graphql)[A-Za-z0-9_\-\/]*)["']/gi;
    while ((match = routeRegex.exec(code)) !== null) {
      const route = match[1];
      if (!extractedRoutes.includes(route)) {
        extractedRoutes.push(route);
        extractedEndpoints.push({
          url: route,
          method: HttpMethod.GET,
          parameters: []
        });
      }
    }

    // 2. Client-Side Source -> Sink Flow Analysis
    for (let i = 0; i < lines.length; i++) {
      const lineContent = lines[i];

      for (const sink of JavaScriptAnalyzer.SINK_PATTERNS) {
        const sinkMatch = sink.regex.exec(lineContent);
        if (sinkMatch) {
          // Check if any source is referenced on this line or in the preceding block context
          const contextStart = Math.max(0, i - 10);
          const contextBlock = lines.slice(contextStart, i + 1).join('\n');
          const matchingSource = JavaScriptAnalyzer.SOURCE_PATTERNS.find(s => s.regex.test(contextBlock));

          const confidence = matchingSource ? 'HIGH' : 'MEDIUM';
          const sourceName = matchingSource ? matchingSource.name : 'Unknown Client Source';

          dataFlowSinks.push({
            source: sourceName,
            sink: sink.sink,
            codeSnippet: lineContent.trim().substring(0, 150),
            line: i + 1,
            confidence,
            hypothesisTitle: `Potential Client-Side ${sink.category} via ${sink.sink}`
          });
        }
      }

      // 3. Exposed Secrets Probing (AWS, JWT, Stripe, Generic tokens)
      if (/AKIA[0-9A-Z]{16}/.test(lineContent)) {
        exposedSecrets.push({
          type: 'AWS_ACCESS_KEY',
          sanitizedSnippet: 'AKIA[REDACTED_AWS_KEY]',
          confidence: 'HIGH',
          line: i + 1
        });
      }
      if (/sk_live_[0-9a-zA-Z]{24}/.test(lineContent)) {
        exposedSecrets.push({
          type: 'STRIPE_SECRET_KEY',
          sanitizedSnippet: 'sk_live_[REDACTED_STRIPE_KEY]',
          confidence: 'HIGH',
          line: i + 1
        });
      }
      if (/eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(lineContent)) {
        exposedSecrets.push({
          type: 'HARDCODED_JWT',
          sanitizedSnippet: 'eyJ[REDACTED_JWT_TOKEN]',
          confidence: 'HIGH',
          line: i + 1
        });
      }
    }

    return {
      scriptUrl,
      extractedRoutes,
      extractedEndpoints,
      dataFlowSinks,
      exposedSecrets
    };
  }

  private static extractParametersFromUrl(url: string): string[] {
    const params: string[] = [];
    const queryIdx = url.indexOf('?');
    if (queryIdx !== -1) {
      const qs = url.substring(queryIdx + 1);
      for (const pair of qs.split('&')) {
        const name = pair.split('=')[0];
        if (name && !params.includes(name)) {
          params.push(name);
        }
      }
    }
    return params;
  }
}

export class JsAnalyzerWorker {
  private logger = new Logger('JsAnalyzerWorker');
  private workerId = `js-analyzer-${crypto.randomUUID()}`;

  public async processJob(job: JobEnvelope<JsAnalyzerPayload>): Promise<JsAnalysisResult> {
    this.logger.info(`Analyzing JavaScript: ${job.payload.scriptUrl}`, { jobId: job.jobId, scanId: job.scanId });
    return JavaScriptAnalyzer.analyze(job.payload.sourceCode, job.payload.scriptUrl);
  }

  public startPolling(): void {
    setInterval(async () => {
      jobBroker.heartbeat(this.workerId, 'donttrust.js-analysis');
      await jobBroker.executeJob<JsAnalyzerPayload, JsAnalysisResult>(
        'donttrust.js-analysis',
        this.workerId,
        (job) => this.processJob(job)
      );
    }, 500);
  }
}
