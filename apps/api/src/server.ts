import express, { Request, Response } from 'express';
import cors from 'cors';
import { store, storage, DbFinding, DbTarget } from './store.js';
import { ScanOrchestrator } from './orchestrator.js';
import { RuleRegistry } from '@aegisscan/rules';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'HEALTHY', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  // Projects
  app.get('/api/v1/projects', (_req: Request, res: Response) => {
    res.json(store.projects.values());
  });

  app.post('/api/v1/projects', (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const id = `proj-${crypto.randomUUID()}`;
    const project = {
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.projects.set(id, project);
    res.status(201).json(project);
  });

  app.get('/api/v1/projects/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const project = store.projects.get(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  });

  // Targets
  app.get('/api/v1/projects/:id/targets', (req: Request, res: Response) => {
    const projectId = String(req.params.id);
    const targets = store.targets.values().filter((t: DbTarget) => t.projectId === projectId);
    res.json(targets);
  });

  app.post('/api/v1/projects/:id/targets', (req: Request, res: Response) => {
    const projectId = String(req.params.id);
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Target URL is required' });

    try {
      const parsed = new URL(url);
      const target = {
        id: `target-${crypto.randomUUID()}`,
        projectId,
        url,
        hostname: parsed.hostname,
        defaultProtocol: parsed.protocol,
        defaultPort: parsed.port ? Number.parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80),
        createdAt: new Date().toISOString()
      };
      store.targets.set(target.id, target);
      res.status(201).json(target);
    } catch {
      res.status(400).json({ error: 'Invalid URL supplied' });
    }
  });

  // Scopes
  app.get('/api/v1/projects/:id/scopes', (req: Request, res: Response) => {
    const projectId = String(req.params.id);
    const scope = store.scopeRules.get(projectId);
    res.json(scope || null);
  });

  // Scans
  app.post('/api/v1/scans', (req: Request, res: Response) => {
    const { projectId, targetId, profileName, activeTestingEnabled, maxRequestsPerSecond } = req.body;
    const target = store.targets.get(targetId);
    if (!target) return res.status(404).json({ error: 'Target not found' });

    const scanId = `scan-${crypto.randomUUID()}`;
    const scan = {
      id: scanId,
      projectId,
      targetId,
      targetUrl: target.url,
      profileName: profileName || 'STANDARD',
      status: 'QUEUED',
      activeTestingEnabled: Boolean(activeTestingEnabled),
      maxRequestsPerSecond: maxRequestsPerSecond || 10,
      maxConcurrency: 5,
      stats: {
        requestsTotal: 0,
        requestsBlockedScope: 0,
        endpointsDiscovered: 0,
        assetsDiscovered: 0,
        findingsCount: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
      }
    };

    store.scans.set(scanId, scan);

    // Launch orchestrator asynchronously
    ScanOrchestrator.startScan(scanId).catch(console.error);

    res.status(202).json(scan);
  });

  app.get('/api/v1/scans', (_req: Request, res: Response) => {
    res.json(store.scans.values());
  });

  app.get('/api/v1/scans/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const scan = store.scans.get(id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  });

  app.get('/api/v1/scans/:id/endpoints', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const endpoints = store.endpoints.get(id) || [];
    res.json(endpoints);
  });

  app.get('/api/v1/scans/:id/findings', (req: Request, res: Response) => {
    const id = String(req.params.id);
    let findings: DbFinding[] = store.findings.get(id) || [];
    const { severity, confidence, category } = req.query;

    if (severity) {
      findings = findings.filter((f: DbFinding) => f.severity === (severity as string).toUpperCase());
    }
    if (confidence) {
      findings = findings.filter((f: DbFinding) => f.confidence === (confidence as string).toUpperCase());
    }
    if (category) {
      findings = findings.filter((f: DbFinding) => f.category === (category as string).toUpperCase());
    }

    res.json(findings);
  });

  app.get('/api/v1/scans/:id/attack-surface', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const graph = store.getOrCreateGraph(id);
    res.json(graph);
  });

  app.get('/api/v1/scans/:id/report', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const reports = store.reports.get(id);
    if (!reports) return res.status(404).json({ error: 'Report not ready or scan not found' });

    const format = (req.query.format as string || 'json').toLowerCase();
    const content = reports[format];
    if (!content) return res.status(400).json({ error: `Format ${format} not supported. Use json, markdown, sarif, or html.` });

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } else if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.send(content);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(content);
    }
  });

  // Baselines & Diff Regression
  app.post('/api/v1/scans/:id/baseline', (req: Request, res: Response) => {
    const scanId = String(req.params.id);
    const scan = store.scans.get(scanId);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const baseline = storage.createBaseline({
      id: `baseline-${crypto.randomUUID()}`,
      projectId: scan.projectId,
      targetId: scan.targetId,
      scanId: scan.id,
      name: req.body.name || `Baseline-${new Date().toISOString()}`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(baseline);
  });

  app.get('/api/v1/scans/:id/diff/:baselineId', (req: Request, res: Response) => {
    const currentScanId = String(req.params.id);
    const baselineScanId = String(req.params.baselineId);

    const diff = storage.compareScanAgainstBaseline(currentScanId, baselineScanId);
    res.json(diff);
  });

  // Rules Catalog
  app.get('/api/v1/rules', (_req: Request, res: Response) => {
    const rules = RuleRegistry.getAllRules().map(r => r.metadata);
    res.json(rules);
  });

  return app;
}
