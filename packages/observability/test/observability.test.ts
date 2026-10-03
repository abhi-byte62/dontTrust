import { describe, it, expect } from 'vitest';
import { MetricsRegistry, Tracer } from '../src/index.js';

describe('Observability Package', () => {
  it('registers and formats Prometheus counters and gauges', () => {
    const registry = MetricsRegistry.getInstance();
    registry.register('aegis_scan_requests_total', 'Total HTTP requests executed', 'counter');
    registry.increment('aegis_scan_requests_total', { target: '127.0.0.1', method: 'GET' }, 5);
    registry.setGauge('aegis_worker_queue_depth', 3, { queue: 'aegis.crawl' });

    const output = registry.toPrometheusFormat();
    expect(output).toContain('# HELP aegis_scan_requests_total Total HTTP requests executed');
    expect(output).toContain('aegis_scan_requests_total{method="GET",target="127.0.0.1"} 5');
    expect(output).toContain('aegis_worker_queue_depth{queue="aegis.crawl"} 3');
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
