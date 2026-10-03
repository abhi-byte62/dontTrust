import { JobEnvelope, jobBroker } from '@donttrust/scanner-sdk';
import { ScopeEngine } from '@donttrust/scope-engine';
import { Logger } from '@donttrust/common';
import { HttpMethod, FormModel } from '@donttrust/protocol-models';

export interface CrawlerJobPayload {
  seedUrl: string;
  scopeConfig: any;
  maxDepth?: number;
}

export interface CrawlStateTransition {
  fromPath: string;
  toPath: string;
  action: 'LINK_NAVIGATION' | 'FORM_SUBMISSION' | 'AJAX_DISCOVERY';
  details: string;
}

export interface DiscoveredEndpointItem {
  id: string;
  url: string;
  path: string;
  method: HttpMethod;
  statusCode: number;
  contentType: string;
  parameters: string[];
  forms: FormModel[];
}

export interface CrawlResult {
  endpoints: DiscoveredEndpointItem[];
  transitions: CrawlStateTransition[];
}

export class HtmlFormExtractor {
  public static extractForms(html: string, pageUrl: string): FormModel[] {
    const forms: FormModel[] = [];
    const formRegex = /<form([^>]*)>([\s\S]*?)<\/form>/gi;
    let formMatch: RegExpExecArray | null;

    while ((formMatch = formRegex.exec(html)) !== null) {
      const formAttrs = formMatch[1];
      const formContent = formMatch[2];

      const actionMatch = /action=["']([^"']*)["']/i.exec(formAttrs);
      const methodMatch = /method=["']([^"']*)["']/i.exec(formAttrs);

      const rawAction = actionMatch ? actionMatch[1] : '';
      let resolvedAction = pageUrl;
      try {
        resolvedAction = new URL(rawAction, pageUrl).toString();
      } catch {}

      const method = (methodMatch ? methodMatch[1].toUpperCase() : 'GET') as HttpMethod;

      const inputs: FormModel['inputs'] = [];
      const inputRegex = /<input([^>]*)>/gi;
      let inputMatch: RegExpExecArray | null;

      while ((inputMatch = inputRegex.exec(formContent)) !== null) {
        const inputAttrs = inputMatch[1];
        const nameMatch = /name=["']([^"']+)["']/i.exec(inputAttrs);
        const typeMatch = /type=["']([^"']+)["']/i.exec(inputAttrs);
        const valMatch = /value=["']([^"']*)["']/i.exec(inputAttrs);

        if (nameMatch) {
          inputs.push({
            name: nameMatch[1],
            type: typeMatch ? typeMatch[1].toLowerCase() : 'text',
            value: valMatch ? valMatch[1] : undefined,
            required: /required/i.test(inputAttrs)
          });
        }
      }

      forms.push({
        id: `form-${crypto.randomUUID()}`,
        pageUrl,
        action: resolvedAction,
        method,
        inputs
      });
    }

    return forms;
  }
}

export class CrawlerWorker {
  private logger = new Logger('CrawlerWorker');
  private workerId = `crawler-worker-${crypto.randomUUID()}`;

  public static normalizeUrl(rawUrl: string): string {
    const parsed = new URL(rawUrl);
    parsed.hash = '';
    const params = Array.from(parsed.searchParams.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    parsed.search = '';
    for (const [k, v] of params) {
      parsed.searchParams.append(k, v);
    }
    return parsed.toString();
  }

  public async processJob(job: JobEnvelope<CrawlerJobPayload>): Promise<CrawlResult> {
    this.logger.info(`Starting state-aware crawler for ${job.payload.seedUrl}`, { scanId: job.scanId });

    const scopeEngine = new ScopeEngine(job.payload.scopeConfig);
    const discovered: DiscoveredEndpointItem[] = [];
    const transitions: CrawlStateTransition[] = [];
    const visited = new Set<string>();

    const queue: string[] = [job.payload.seedUrl];

    while (queue.length > 0 && discovered.length < 50) {
      const currentUrl = queue.shift()!;
      const normalized = CrawlerWorker.normalizeUrl(currentUrl);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      if (!scopeEngine.isAllowed(currentUrl)) {
        this.logger.debug(`Skipping out-of-scope URL: ${currentUrl}`);
        continue;
      }

      try {
        const res = await fetch(currentUrl, { method: 'GET' });
        const text = await res.text();
        const contentType = res.headers.get('content-type') || 'text/html';
        const parsed = new URL(currentUrl);

        const params = Array.from(parsed.searchParams.keys());
        const forms = HtmlFormExtractor.extractForms(text, currentUrl);

        // Record form endpoints & transitions
        for (const f of forms) {
          try {
            const formUrlObj = new URL(f.action);
            if (scopeEngine.isAllowed(f.action)) {
              transitions.push({
                fromPath: parsed.pathname || '/',
                toPath: formUrlObj.pathname || '/',
                action: 'FORM_SUBMISSION',
                details: `${f.method} form with ${f.inputs.length} inputs (${f.inputs.map(i => i.name).join(', ')})`
              });

              if (!visited.has(CrawlerWorker.normalizeUrl(f.action))) {
                discovered.push({
                  id: crypto.randomUUID(),
                  url: f.action,
                  path: formUrlObj.pathname || '/',
                  method: f.method,
                  statusCode: 200,
                  contentType: 'text/html',
                  parameters: f.inputs.map(i => i.name),
                  forms: []
                });
              }
            }
          } catch {}
        }

        // Parse links from HTML
        const hrefRegex = /href=["']([^"']+)["']/gi;
        let match: RegExpExecArray | null;
        while ((match = hrefRegex.exec(text)) !== null) {
          const href = match[1];
          if (!href.startsWith('javascript:') && !href.startsWith('mailto:')) {
            try {
              const fullUrl = new URL(href, currentUrl).toString();
              const destObj = new URL(fullUrl);

              if (scopeEngine.isAllowed(fullUrl)) {
                transitions.push({
                  fromPath: parsed.pathname || '/',
                  toPath: destObj.pathname || '/',
                  action: 'LINK_NAVIGATION',
                  details: `<a> link navigation to ${destObj.pathname}`
                });

                if (!visited.has(CrawlerWorker.normalizeUrl(fullUrl))) {
                  queue.push(fullUrl);
                }
              }
            } catch {}
          }
        }

        discovered.push({
          id: crypto.randomUUID(),
          url: currentUrl,
          path: parsed.pathname || '/',
          method: 'GET',
          statusCode: res.status,
          contentType,
          parameters: params,
          forms
        });
      } catch (err: any) {
        this.logger.debug(`Failed to crawl ${currentUrl}: ${err.message}`);
      }
    }

    return { endpoints: discovered, transitions };
  }

  public startPolling(): void {
    setInterval(async () => {
      jobBroker.heartbeat(this.workerId, 'donttrust.crawl');
      await jobBroker.executeJob<CrawlerJobPayload, CrawlResult>(
        'donttrust.crawl',
        this.workerId,
        (job) => this.processJob(job)
      );
    }, 500);
  }
}
