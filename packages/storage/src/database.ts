import { Logger } from '@donttrust/common';

export interface QueryFilter {
  [key: string]: unknown;
}

export class DatabaseDriver {
  private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();
  private logger = new Logger('DatabaseDriver');

  constructor() {
    this.initTables();
  }

  private initTables(): void {
    const tableNames = [
      'projects',
      'targets',
      'scope_rules',
      'auth_profiles',
      'scans',
      'discovered_endpoints',
      'findings',
      'finding_evidence',
      'attack_surface_nodes',
      'attack_surface_edges',
      'scan_baselines',
      'scan_diffs'
    ];

    for (const t of tableNames) {
      if (!this.tables.has(t)) {
        this.tables.set(t, new Map());
      }
    }
  }

  public insert(table: string, id: string, record: Record<string, unknown>): void {
    const t = this.tables.get(table);
    if (!t) throw new Error(`Table ${table} does not exist`);
    t.set(id, { ...record, id });
  }

  public get(table: string, id: string): Record<string, unknown> | null {
    const t = this.tables.get(table);
    if (!t) return null;
    return t.get(id) || null;
  }

  public update(table: string, id: string, updates: Record<string, unknown>): void {
    const t = this.tables.get(table);
    if (!t || !t.has(id)) throw new Error(`Record ${id} in ${table} not found for update`);
    const existing = t.get(id)!;
    t.set(id, { ...existing, ...updates, id });
  }

  public delete(table: string, id: string): boolean {
    const t = this.tables.get(table);
    if (!t) return false;
    return t.delete(id);
  }

  public query(table: string, filter: QueryFilter = {}): Record<string, unknown>[] {
    const t = this.tables.get(table);
    if (!t) return [];

    let results = Array.from(t.values());
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        results = results.filter(item => item[key] === value);
      }
    }
    return results;
  }

  public clear(): void {
    for (const t of this.tables.values()) {
      t.clear();
    }
  }
}
