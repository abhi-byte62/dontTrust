import { describe, it, expect } from 'vitest';
import { ScopeEngine } from '../src/index.js';

describe('ScopeEngine Policy & Boundaries', () => {
  const engine = new ScopeEngine({
    allowedDomains: ['example.com', '*.target.org'],
    excludedDomains: ['billing.target.org'],
    excludedPaths: ['/logout', '/auth/signout', '/admin/delete*'],
    allowedProtocols: ['http:', 'https:'],
    allowedPorts: [80, 443, 8080]
  });

  it('allows exact allowed domain', () => {
    const res = engine.evaluate('https://example.com/api/v1/data');
    expect(res.allowed).toBe(true);
  });

  it('allows wildcard subdomains', () => {
    expect(engine.isAllowed('https://api.target.org/v1/test')).toBe(true);
    expect(engine.isAllowed('https://sub.auth.target.org/login')).toBe(true);
  });

  it('blocks excluded subdomains explicitly', () => {
    const res = engine.evaluate('https://billing.target.org/invoice');
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('DOMAIN_EXCLUDED');
  });

  it('blocks out of scope domains', () => {
    const res = engine.evaluate('https://attacker.com/payload');
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('DOMAIN_NOT_ALLOWED');
  });

  it('blocks excluded sensitive paths to prevent state destruction', () => {
    expect(engine.evaluate('https://example.com/logout').reason).toBe('PATH_EXCLUDED');
    expect(engine.evaluate('https://example.com/admin/delete_user').reason).toBe('PATH_EXCLUDED');
  });

  it('blocks dangerous or unsupported protocols (file, gopher, ftp)', () => {
    expect(engine.evaluate('file:///etc/passwd').reason).toBe('UNSUPPORTED_PROTOCOL');
    expect(engine.evaluate('gopher://127.0.0.1:70/').reason).toBe('UNSUPPORTED_PROTOCOL');
  });

  it('blocks unapproved port numbers', () => {
    expect(engine.evaluate('http://example.com:9999/test').reason).toBe('BLOCKED_PORT');
  });
});
