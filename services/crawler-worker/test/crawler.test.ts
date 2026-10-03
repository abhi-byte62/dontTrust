import { describe, it, expect } from 'vitest';
import { CrawlerWorker, HtmlFormExtractor } from '../src/index.js';

describe('State-Aware CrawlerWorker & Form Extractor', () => {
  it('normalizes URLs deterministically with sorted query parameters and stripped hashes', () => {
    const raw = 'http://app.target.local:8080/search?sort=desc&q=security#top-banner';
    const normalized = CrawlerWorker.normalizeUrl(raw);
    expect(normalized).toBe('http://app.target.local:8080/search?q=security&sort=desc');
  });

  it('extracts HTML forms and input field metadata', () => {
    const html = `
      <html>
        <body>
          <form action="/login" method="POST">
            <input type="text" name="username" required />
            <input type="password" name="password" required />
            <input type="hidden" name="csrf_token" value="xyz999" />
          </form>
        </body>
      </html>
    `;

    const forms = HtmlFormExtractor.extractForms(html, 'http://app.target.local');
    expect(forms.length).toBe(1);
    expect(forms[0].method).toBe('POST');
    expect(forms[0].action).toBe('http://app.target.local/login');
    expect(forms[0].inputs.length).toBe(3);
    expect(forms[0].inputs.some(i => i.name === 'username' && i.required)).toBe(true);
  });
});
