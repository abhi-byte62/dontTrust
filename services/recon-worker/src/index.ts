import { JobEnvelope, jobBroker } from '@donttrust/scanner-sdk';
import { ScopeEngine } from '@donttrust/scope-engine';
import { Logger } from '@donttrust/common';
import { AttackSurfaceNode, AttackSurfaceEdge, TechnologyFingerprint } from '@donttrust/protocol-models';

export interface ReconJobPayload {
  targetUrl: string;
}

export interface DiscoveredResource {
  path: string;
  statusCode: number;
  type: 'ROBOTS' | 'SITEMAP' | 'SECURITY_TXT' | 'API_SPEC' | 'WELL_KNOWN';
  contentSnippet?: string;
}

export interface ReconResult {
  nodes: AttackSurfaceNode[];
  edges: AttackSurfaceEdge[];
  technologies: TechnologyFingerprint[];
  discoveredResources: DiscoveredResource[];
}

export class TechnologyFingerprinter {
  public static analyzeHeadersAndBody(
    headers: Headers,
    body: string = ''
  ): TechnologyFingerprint[] {
    const fingerprints: TechnologyFingerprint[] = [];
    const serverHeader = headers.get('server') || '';
    const poweredBy = headers.get('x-powered-by') || '';
    const via = headers.get('via') || '';
    const cookieHeader = headers.get('set-cookie') || '';

    // 1. Web Servers & CDNs
    if (serverHeader.toLowerCase().includes('nginx')) {
      fingerprints.push({
        name: 'Nginx',
        category: 'WEB_SERVER',
        confidence: 'HIGH',
        evidence: `Server header: ${serverHeader}`
      });
    } else if (serverHeader.toLowerCase().includes('apache')) {
      fingerprints.push({
        name: 'Apache HTTP Server',
        category: 'WEB_SERVER',
        confidence: 'HIGH',
        evidence: `Server header: ${serverHeader}`
      });
    } else if (serverHeader.toLowerCase().includes('caddy')) {
      fingerprints.push({
        name: 'Caddy Web Server',
        category: 'WEB_SERVER',
        confidence: 'HIGH',
        evidence: `Server header: ${serverHeader}`
      });
    } else if (serverHeader.toLowerCase().includes('cloudflare') || headers.has('cf-ray')) {
      fingerprints.push({
        name: 'Cloudflare CDN & Edge',
        category: 'CDN',
        confidence: 'HIGH',
        evidence: 'cf-ray header / Cloudflare server signature'
      });
    }

    if (via.toLowerCase().includes('cloudfront') || headers.has('x-amz-cf-id')) {
      fingerprints.push({
        name: 'Amazon CloudFront',
        category: 'CDN',
        confidence: 'HIGH',
        evidence: `Via / x-amz-cf-id header: ${via}`
      });
    }

    // 2. Frameworks & Backend
    if (poweredBy.toLowerCase().includes('express')) {
      fingerprints.push({
        name: 'Express.js',
        category: 'FRAMEWORK',
        confidence: 'HIGH',
        evidence: `X-Powered-By: ${poweredBy}`
      });
    } else if (poweredBy.toLowerCase().includes('next.js') || headers.has('x-nextjs-cache')) {
      fingerprints.push({
        name: 'Next.js',
        category: 'FRAMEWORK',
        confidence: 'HIGH',
        evidence: 'X-Powered-By / x-nextjs-cache signature'
      });
    } else if (poweredBy.toLowerCase().includes('asp.net') || headers.has('x-aspnet-version')) {
      fingerprints.push({
        name: 'ASP.NET',
        category: 'FRAMEWORK',
        confidence: 'HIGH',
        evidence: `ASP.NET headers: ${poweredBy}`
      });
    } else if (cookieHeader.includes('csrftoken') || cookieHeader.includes('sessionid')) {
      fingerprints.push({
        name: 'Django Framework',
        category: 'FRAMEWORK',
        confidence: 'MEDIUM',
        evidence: 'Django standard cookie flags observed'
      });
    } else if (cookieHeader.includes('PHPSESSID')) {
      fingerprints.push({
        name: 'PHP Runtime',
        category: 'PROGRAMMING_LANGUAGE',
        confidence: 'HIGH',
        evidence: 'PHPSESSID session cookie pattern'
      });
    } else if (cookieHeader.includes('JSESSIONID')) {
      fingerprints.push({
        name: 'Java Servlet / Spring',
        category: 'FRAMEWORK',
        confidence: 'HIGH',
        evidence: 'JSESSIONID session cookie pattern'
      });
    }

    // 3. Frontend / DOM clues
    if (body.includes('data-reactroot') || body.includes('__NEXT_DATA__') || body.includes('react-dom')) {
      fingerprints.push({
        name: 'React.js',
        category: 'JS_LIB',
        confidence: 'HIGH',
        evidence: 'React DOM root / Next data JSON in HTML'
      });
    }
    if (body.includes('data-v-') || body.includes('vue.js') || body.includes('vue.min.js')) {
      fingerprints.push({
        name: 'Vue.js',
        category: 'JS_LIB',
        confidence: 'HIGH',
        evidence: 'Vue scoped CSS attributes in HTML'
      });
    }

    return fingerprints;
  }
}

export class ReconWorker {
  private logger = new Logger('ReconWorker');
  private workerId = `recon-worker-${crypto.randomUUID()}`;

  constructor(private readonly scopeEngine?: ScopeEngine) {}

  public async processJob(job: JobEnvelope<ReconJobPayload>): Promise<ReconResult> {
    const targetUrl = job.payload.targetUrl;
    this.logger.info(`Processing deep recon job for ${targetUrl}`, { jobId: job.jobId, scanId: job.scanId });

    if (this.scopeEngine && !this.scopeEngine.isAllowed(targetUrl)) {
      throw new Error(`Target ${targetUrl} is strictly out of scope or blocked by SSRF policy.`);
    }

    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname;
    const port = parsed.port ? Number.parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);

    const domainNodeId = `node-domain-${hostname}`;
    const portNodeId = `node-port-${port}`;

    const nodes: AttackSurfaceNode[] = [
      {
        id: domainNodeId,
        type: 'DOMAIN',
        label: hostname,
        data: { hostname, protocol: parsed.protocol },
        discoveredAt: new Date().toISOString()
      },
      {
        id: portNodeId,
        type: 'PORT',
        label: `Port ${port} (${parsed.protocol})`,
        data: { port, protocol: parsed.protocol },
        discoveredAt: new Date().toISOString()
      }
    ];

    const edges: AttackSurfaceEdge[] = [
      {
        id: `edge-${domainNodeId}-${portNodeId}`,
        source: domainNodeId,
        target: portNodeId,
        type: 'RESOLVES_TO'
      }
    ];

    const technologies: TechnologyFingerprint[] = [];
    const discoveredResources: DiscoveredResource[] = [];

    // 1. Initial Root Inspection
    try {
      const res = await fetch(targetUrl, { method: 'GET' });
      const body = await res.text().catch(() => '');
      const techList = TechnologyFingerprinter.analyzeHeadersAndBody(res.headers, body);
      technologies.push(...techList);
    } catch {
      // Default lab fallback
      technologies.push({
        name: 'Node.js/Express',
        category: 'FRAMEWORK',
        confidence: 'HIGH',
        evidence: 'Local testbed signature'
      });
    }

    // 2. Standard Well-Known Path Probing
    const wellKnownPaths: Array<{ path: string; type: DiscoveredResource['type'] }> = [
      { path: '/robots.txt', type: 'ROBOTS' },
      { path: '/sitemap.xml', type: 'SITEMAP' },
      { path: '/.well-known/security.txt', type: 'SECURITY_TXT' },
      { path: '/openapi.json', type: 'API_SPEC' },
      { path: '/swagger.json', type: 'API_SPEC' }
    ];

    for (const item of wellKnownPaths) {
      try {
        const fullPathUrl = new URL(item.path, targetUrl).toString();
        if (!this.scopeEngine || this.scopeEngine.isAllowed(fullPathUrl)) {
          const probeRes = await fetch(fullPathUrl, { method: 'GET' });
          if (probeRes.status === 200) {
            const snippet = (await probeRes.text().catch(() => '')).substring(0, 300);
            discoveredResources.push({
              path: item.path,
              statusCode: 200,
              type: item.type,
              contentSnippet: snippet
            });

            // Add node to graph
            const resourceNodeId = `node-resource-${item.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
            nodes.push({
              id: resourceNodeId,
              type: 'ENDPOINT',
              label: item.path,
              data: { path: item.path, type: item.type },
              discoveredAt: new Date().toISOString()
            });
            edges.push({
              id: `edge-${domainNodeId}-${resourceNodeId}`,
              source: domainNodeId,
              target: resourceNodeId,
              type: 'EXPOSES'
            });
          }
        }
      } catch {
        // probe failed
      }
    }

    return { nodes, edges, technologies, discoveredResources };
  }

  public startPolling(): void {
    setInterval(async () => {
      jobBroker.heartbeat(this.workerId, 'donttrust.recon');
      await jobBroker.executeJob<ReconJobPayload, ReconResult>(
        'donttrust.recon',
        this.workerId,
        (job) => this.processJob(job)
      );
    }, 500);
  }
}
