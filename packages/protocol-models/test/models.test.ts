import { describe, it, expect } from 'vitest';
import { AttackSurfaceGraph, CookieModel } from '../src/index.js';

describe('Protocol Models & Graph Structures', () => {
  it('validates graph node and edge creation', () => {
    const graph: AttackSurfaceGraph = {
      nodes: [
        {
          id: 'domain-1',
          type: 'DOMAIN',
          label: 'app.target.local',
          data: { ip: '93.184.216.34' },
          discoveredAt: new Date().toISOString()
        },
        {
          id: 'ep-1',
          type: 'ENDPOINT',
          label: '/api/v1/auth',
          data: { method: 'POST', requiresAuth: false },
          discoveredAt: new Date().toISOString()
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'domain-1',
          target: 'ep-1',
          type: 'EXPOSES'
        }
      ]
    };

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].type).toBe('EXPOSES');
  });

  it('verifies cookie security model structure', () => {
    const cookie: CookieModel = {
      name: '__Host-session',
      value: 'secure_val',
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
      rawHeader: '__Host-session=secure_val; Secure; HttpOnly; SameSite=Strict'
    };
    expect(cookie.secure).toBe(true);
    expect(cookie.httpOnly).toBe(true);
  });
});
