export type NodeType =
  | 'DOMAIN'
  | 'SUBDOMAIN'
  | 'IP'
  | 'PORT'
  | 'PAGE'
  | 'ENDPOINT'
  | 'PARAMETER'
  | 'FORM'
  | 'SCRIPT'
  | 'API'
  | 'GRAPHQL'
  | 'WEBSOCKET'
  | 'TECHNOLOGY'
  | 'FINDING';

export type EdgeType =
  | 'RESOLVES_TO'
  | 'EXPOSES'
  | 'CONTAINS'
  | 'LOADS'
  | 'CALLS'
  | 'SUBMITS_TO'
  | 'ACCEPTS'
  | 'USES'
  | 'AFFECTS';

export interface AttackSurfaceNode {
  id: string;
  type: NodeType;
  label: string;
  data: Record<string, unknown>;
  discoveredAt: string;
}

export interface AttackSurfaceEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  data?: Record<string, unknown>;
}

export interface AttackSurfaceGraph {
  nodes: AttackSurfaceNode[];
  edges: AttackSurfaceEdge[];
}
