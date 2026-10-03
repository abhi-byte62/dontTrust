import { describe, it, expect } from 'vitest';
import { MetricsRegistry, Tracer } from '../src/index.js';

describe('Observability Package', () => {
  it('registers and formats Prometheus counters and gauges', () => {
    const registry = MetricsRegistry.getInstance();
    registry.register('donttrust_scan_requests_total', 'Total HTTP requests executed', 'counter');
    registry.increment('donttrust_scan_requests_total', { target: '127.0.0.1', method: 'GET' }, 5);
    registry.setGauge('donttrust_worker_queue_depth', 3, { queue: 'donttrust.crawl' });

    const output = registry.toPrometheusFormat();
    expect(output).toContain('# HELP donttrust_scan_requests_total Total HTTP requests executed');
    expect(output).toContain('donttrust_scan_requests_total{method="GET",target="127.0.0.1"} 5');
    expect(output).toContain('donttrust_worker_queue_depth{queue="donttrust.crawl"} 3');
  });

  it('generates distributed tracing spans with duration', async () => {
    const span = Tracer.startSpan('crawl_target');
    expect(span.traceId).toBeDefined();
    expect(span.spanId).toBeDefined();

    await new Promise(r => setTimeout(r, 10));
    Tracer.endSpan(span, { status: 'success', status_code: 200 });

    expect(span.durationMs).toBeGreaterThanOrEqual(5);
    expect(span.attributes['status']).toBe('success');
  });
});
