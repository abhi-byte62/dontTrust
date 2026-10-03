import { Hasher } from '@donttrust/common';

export interface MetricCounter {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  values: Map<string, number>;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  attributes: Record<string, string | number | boolean>;
}

export class MetricsRegistry {
  private static instance: MetricsRegistry;
  private counters: Map<string, MetricCounter> = new Map();

  public static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  public register(name: string, help: string, type: 'counter' | 'gauge' | 'histogram' = 'counter'): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, {
        name,
        help,
        type,
        values: new Map()
      });
    }
  }

  public increment(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    let metric = this.counters.get(name);
    if (!metric) {
      this.register(name, name, 'counter');
      metric = this.counters.get(name)!;
    }
    const labelKey = this.formatLabels(labels);
    const curr = metric.values.get(labelKey) || 0;
    metric.values.set(labelKey, curr + value);
  }

  public setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    let metric = this.counters.get(name);
    if (!metric) {
      this.register(name, name, 'gauge');
      metric = this.counters.get(name)!;
    }
    const labelKey = this.formatLabels(labels);
    metric.values.set(labelKey, value);
  }

  public toPrometheusFormat(): string {
    const lines: string[] = [];

    for (const [name, metric] of this.counters.entries()) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} ${metric.type}`);
      for (const [labels, val] of metric.values.entries()) {
        if (labels) {
          lines.push(`${name}{${labels}} ${val}`);
        } else {
          lines.push(`${name} ${val}`);
        }
      }
    }

    return lines.join('\n') + '\n';
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`).join(',');
  }
}

export class Tracer {
  public static createTraceId(): string {
    return Hasher.sha256(Math.random().toString() + Date.now().toString()).substring(0, 32);
  }

  public static createSpanId(): string {
    return Hasher.sha256(Math.random().toString() + Date.now().toString()).substring(0, 16);
  }

  public static startSpan(name: string, parentTraceId?: string, parentSpanId?: string): TraceSpan {
    return {
      traceId: parentTraceId || Tracer.createTraceId(),
      spanId: Tracer.createSpanId(),
      parentSpanId,
      name,
      startTimeMs: Date.now(),
      attributes: {}
    };
  }

  public static endSpan(span: TraceSpan, attributes: Record<string, string | number | boolean> = {}): TraceSpan {
    span.endTimeMs = Date.now();
    span.durationMs = span.endTimeMs - span.startTimeMs;
    span.attributes = { ...span.attributes, ...attributes };
    return span;
  }
}
