import { Project, Target, Scan, Finding, DiscoveredEndpoint, AttackSurfaceGraph, RuleMeta } from './types.js';

const API_BASE = '/api/v1';

export const api = {
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    return res.json();
  },

  async createProject(name: string, description: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    return res.json();
  },

  async getTargets(projectId: string): Promise<Target[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/targets`);
    return res.json();
  },

  async createTarget(projectId: string, url: string): Promise<Target> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async getScans(): Promise<Scan[]> {
    const res = await fetch(`${API_BASE}/scans`);
    return res.json();
  },

  async getScan(id: string): Promise<Scan> {
    const res = await fetch(`${API_BASE}/scans/${id}`);
    return res.json();
  },

  async startScan(params: {
    projectId: string;
    targetId: string;
    profileName: string;
    activeTestingEnabled: boolean;
    maxRequestsPerSecond: number;
  }): Promise<Scan> {
    const res = await fetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async getEndpoints(scanId: string): Promise<DiscoveredEndpoint[]> {
    const res = await fetch(`${API_BASE}/scans/${scanId}/endpoints`);
    return res.json();
  },

  async getFindings(scanId: string): Promise<Finding[]> {
    const res = await fetch(`${API_BASE}/scans/${scanId}/findings`);
    return res.json();
  },

  async getAttackSurface(scanId: string): Promise<AttackSurfaceGraph> {
    const res = await fetch(`${API_BASE}/scans/${scanId}/attack-surface`);
    return res.json();
  },

  async getRules(): Promise<RuleMeta[]> {
    const res = await fetch(`${API_BASE}/rules`);
    return res.json();
  }
};
