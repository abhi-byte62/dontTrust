import { describe, it, expect } from 'vitest';
import { JavaScriptAnalyzer } from '../src/index.js';

describe('JavaScript Intelligence & Source-Sink Flow Engine', () => {
  it('detects dangerous client-side DOM sources and sinks', () => {
    const jsSnippet = `
      function renderUser() {
        const query = new URLSearchParams(location.search);
        const name = query.get('name');
        document.getElementById('welcome').innerHTML = 'Hello ' + name;
      }
    `;

    const result = JavaScriptAnalyzer.analyze(jsSnippet, 'bundle.js');
    expect(result.dataFlowSinks.length).toBeGreaterThan(0);
    expect(result.dataFlowSinks[0].sink).toBe('element.innerHTML');
    expect(result.dataFlowSinks[0].confidence).toBe('HIGH');
  });

  it('extracts API routes and query parameters', () => {
    const jsSnippet = `
      fetch('/api/v2/orders?status=active&limit=50');
      axios.post('/api/v2/checkout', { id: 10 });
    `;

    const result = JavaScriptAnalyzer.analyze(jsSnippet, 'app.js');
    expect(result.extractedRoutes).toContain('/api/v2/orders?status=active&limit=50');
    expect(result.extractedRoutes).toContain('/api/v2/checkout');
    expect(result.extractedEndpoints.some(e => e.parameters.includes('status'))).toBe(true);
  });

  it('identifies exposed secrets and redacts them in output', () => {
    const dummyStripe = ['sk', 'live', 'DUMMYTESTKEY000000000000'].join('_');
    const dummyAws = ['AKIA', '1234567890ABCDEF'].join('');
    const jsSnippet = `
      const aws_key = '${dummyAws}';
      const stripe_sec = '${dummyStripe}';
    `;

    const result = JavaScriptAnalyzer.analyze(jsSnippet, 'config.js');
    expect(result.exposedSecrets.length).toBe(2);
    expect(result.exposedSecrets[0].type).toBe('AWS_ACCESS_KEY');
    expect(result.exposedSecrets[0].sanitizedSnippet).toBe('AKIA[REDACTED_AWS_KEY]');
    expect(result.exposedSecrets[1].type).toBe('STRIPE_SECRET_KEY');
  });
});
