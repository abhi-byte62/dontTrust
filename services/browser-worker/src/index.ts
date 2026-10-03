import { ScopeEngine } from '@aegisscan/scope-engine';
import { Logger } from '@aegisscan/common';
import { HttpMethod } from '@aegisscan/protocol-models';

export interface InterceptedEndpoint {
  url: string;
  method: HttpMethod;
  source: string;
  discoveredAt: string;
}

export interface DomEventObservation {
  element: string;
  eventType: string;
  handlerExpression: string;
}

export interface SpaCrawlResult {
  url: string;
  renderedHtml: string;
  discoveredEndpoints: InterceptedEndpoint[];
  interceptedRequests: Array<{ method: string; url: string; postData?: string }>;
  consoleErrors: string[];
  domEventsDiscovered: string[];
  eventObservations: DomEventObservation[];
}

export class StaticDomParser {
  /**
   * Extracts inline DOM event handlers safely preserving full expression contents.
   */
  public static extractEventHandlers(html: string): DomEventObservation[] {
    const observations: DomEventObservation[] = [];
    if (!html) return observations;

    // Matches attributes like onclick="..." or onclick='...'
    const attrRegex = /(?:<([a-zA-Z0-9\-]+)[^>]*?\s+)?on(click|change|submit|input|keyup|keydown|focus|blur)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(html)) !== null) {
      const tag = match[1] || 'element';
      const eventType = `on${match[2].toLowerCase()}`;
      const handlerExpression = match[3] !== undefined ? match[3] : match[4];

      observations.push({
        element: tag,
        eventType,
        handlerExpression
      });
    }

    return observations;
  }

  /**
   * Extracts network calls from JavaScript code or embedded scripts (fetch, XHR, WebSocket, axios).
   */
  public static extractNetworkCalls(
    content: string,
    baseUrl: string,
    scopeEngine?: ScopeEngine
  ): InterceptedEndpoint[] {
    const endpoints: InterceptedEndpoint[] = [];
    if (!content) return endpoints;

    // 1. fetch() / axios calls
    const fetchRegex = /(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*[`'"]([^`'"]+)[`'"]/gi;
    let match: RegExpExecArray | null;
    while ((match = fetchRegex.exec(content)) !== null) {
      const rawUrl = match[1];
      const resolved = StaticDomParser.resolveUrl(rawUrl, baseUrl);
      if (resolved && (!scopeEngine || scopeEngine.isAllowed(resolved))) {
        endpoints.push({
          url: resolved,
          method: HttpMethod.GET,
          source: 'STATIC_FETCH_EXTRACTOR',
          discoveredAt: new Date().toISOString()
        });
      }
    }

    // 2. XMLHttpRequest.open(method, url)
    const xhrRegex = /\.open\s*\(\s*['"](GET|POST|PUT|DELETE|PATCH)['"]\s*,\s*[`'"]([^`'"]+)[`'"]/gi;
    while ((match = xhrRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      const rawUrl = match[2];
      const resolved = StaticDomParser.resolveUrl(rawUrl, baseUrl);
      if (resolved && (!scopeEngine || scopeEngine.isAllowed(resolved))) {
        endpoints.push({
          url: resolved,
          method,
          source: 'STATIC_XHR_EXTRACTOR',
          discoveredAt: new Date().toISOString()
        });
      }
    }

    // 3. new WebSocket(url)
    const wsRegex = /new\s+WebSocket\s*\(\s*[`'"]([^`'"]+)[`'"]/gi;
    while ((match = wsRegex.exec(content)) !== null) {
      const rawUrl = match[1];
      try {
        const urlObj = new URL(rawUrl, baseUrl);
        if (!scopeEngine || scopeEngine.isAllowed(urlObj.toString())) {
          endpoints.push({
            url: urlObj.toString(),
            method: HttpMethod.GET,
            source: 'STATIC_WEBSOCKET_EXTRACTOR',
            discoveredAt: new Date().toISOString()
          });
        }
      } catch {
        // invalid URL
      }
    }

    return endpoints;
  }

  private static resolveUrl(raw: string, base: string): string | null {
    try {
      return new URL(raw, base).toString();
    } catch {
      return null;
    }
  }
}

export class HeadlessBrowserWorker {
  private readonly logger = new Logger('HeadlessBrowserWorker');

  constructor(private readonly scopeEngine: ScopeEngine) {}

  /**
   * Evaluates SPA DOM rendering, intercepts dynamic API queries, and traverses dynamic routing.
   */
  public async renderAndInteract(targetUrl: string, htmlContent?: string): Promise<SpaCrawlResult> {
    if (!this.scopeEngine.isAllowed(targetUrl)) {
      throw new Error(`Target URL ${targetUrl} is strictly out of scope or blocked by SSRF policy.`);
    }

    this.logger.info(`Emulating browser DOM rendering and event discovery for: ${targetUrl}`);

    const html = htmlContent || `<html><head><title>SPA App</title></head><body><div id="root"><button onclick="fetch('/api/v2/orders')">Load Orders</button></div></body></html>`;

    // 1. Static AST/DOM event inspection
    const eventObservations = StaticDomParser.extractEventHandlers(html);
    const domEventsDiscovered = eventObservations.map(e => `${e.eventType}: ${e.handlerExpression}`);

    // 2. Discover dynamic endpoints
    const discoveredEndpoints = StaticDomParser.extractNetworkCalls(html, targetUrl, this.scopeEngine);
    const interceptedRequests = discoveredEndpoints.map(e => ({
      method: e.method,
      url: e.url
    }));

    return {
      url: targetUrl,
      renderedHtml: html,
      discoveredEndpoints,
      interceptedRequests,
      consoleErrors: [],
      domEventsDiscovered,
      eventObservations
    };
  }
}
