import { describe, it, expect } from 'vitest';
import { HeadlessBrowserWorker, StaticDomParser } from '../src/index.js';
import { ScopeEngine } from '@donttrust/scope-engine';

describe('HeadlessBrowserWorker & StaticDomParser', () => {
  const scopeEngine = new ScopeEngine({
    allowedDomains: ['app.target.local'],
    allowPrivateAddresses: true
  });

  const worker = new HeadlessBrowserWorker(scopeEngine);

  it('preserves complete inline handler expressions without truncation', () => {
    const complexDom = `
      <div id="container">
        <button onclick="fetch('/api/v2/orders?status=open&limit=10')">Load Orders</button>
        <input type="text" onchange="doValidate(this.value)" oninput="handleInput(event)" />
        <form onsubmit="return submitPayment('stripe_tok_123')">
          <button type="submit">Submit</button>
        </form>
      </div>
    `;

    const events = StaticDomParser.extractEventHandlers(complexDom);
    expect(events.length).toBe(4);

    const clickEvent = events.find(e => e.eventType === 'onclick');
    expect(clickEvent?.handlerExpression).toBe("fetch('/api/v2/orders?status=open&limit=10')");

    const submitEvent = events.find(e => e.eventType === 'onsubmit');
    expect(submitEvent?.handlerExpression).toBe("return submitPayment('stripe_tok_123')");
  });

  it('extracts fetch, XMLHttpRequest, and WebSocket invocations correctly', () => {
    const scriptContent = `
      fetch('/api/v1/user/profile');
      axios.post('/api/v1/checkout', { items: [] });
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/v1/upload');
      const ws = new WebSocket('ws://app.target.local/ws/live-feed');
    `;

    const endpoints = StaticDomParser.extractNetworkCalls(scriptContent, 'http://app.target.local', scopeEngine);
    expect(endpoints.some(e => e.url === 'http://app.target.local/api/v1/user/profile')).toBe(true);
    expect(endpoints.some(e => e.url === 'http://app.target.local/api/v1/checkout')).toBe(true);
    expect(endpoints.some(e => e.url === 'http://app.target.local/api/v1/upload' && e.method === 'POST')).toBe(true);
    expect(endpoints.some(e => e.url === 'ws://app.target.local/ws/live-feed')).toBe(true);
  });

  it('renders and interacts with target URL in scope', async () => {
    const mockSpaDom = `
      <html>
        <body>
          <div id="app">
            <button onclick="fetch('/api/v2/orders')">View Orders</button>
            <form onsubmit="doSearch()">
              <input type="text" name="q" />
            </form>
          </div>
        </body>
      </html>
    `;

    const result = await worker.renderAndInteract('http://app.target.local/dashboard', mockSpaDom);

    expect(result.interceptedRequests.length).toBe(1);
    expect(result.interceptedRequests[0].url).toBe('http://app.target.local/api/v2/orders');
    expect(result.domEventsDiscovered.length).toBe(2);
    expect(result.domEventsDiscovered).toContain("onclick: fetch('/api/v2/orders')");
    expect(result.domEventsDiscovered).toContain("onsubmit: doSearch()");
  });

  it('blocks out-of-scope SPA targets', async () => {
    await expect(worker.renderAndInteract('http://evil.com/app')).rejects.toThrow('strictly out of scope');
  });
});
