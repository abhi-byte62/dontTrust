import { describe, it, expect } from 'vitest';
import { ScopeEngine } from '../src/index.js';

describe('SSRF & Private Network Defense', () => {
  const secureEngine = new ScopeEngine({
    allowedDomains: ['*'], // even with wildcard
    allowPrivateAddresses: false
  });

  it('strictly blocks loopback IPv4 addresses', () => {
    expect(secureEngine.evaluate('http://127.0.0.1:80/').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
    expect(secureEngine.evaluate('http://127.0.0.2:80/').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
  });

  it('strictly blocks localhost hostnames', () => {
    expect(secureEngine.evaluate('http://localhost/admin').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
    expect(secureEngine.evaluate('http://test.localhost:8080/').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
  });

  it('strictly blocks AWS / Cloud metadata service (169.254.169.254)', () => {
    expect(secureEngine.evaluate('http://169.254.169.254/latest/meta-data/').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
  });

  it('strictly blocks RFC 1918 private subnets', () => {
    expect(secureEngine.evaluate('http://10.0.0.5/internal').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
    expect(secureEngine.evaluate('http://172.16.1.1/').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
    expect(secureEngine.evaluate('http://192.168.1.1/router').reason).toBe('SSRF_BLOCKED_PRIVATE_IP');
  });

  it('allows private network addresses only when explicitly authorized in lab mode', () => {
    const labEngine = new ScopeEngine({
      allowedDomains: ['127.0.0.1', 'localhost'],
      allowPrivateAddresses: true
    });
    expect(labEngine.evaluate('http://127.0.0.1:8080/').allowed).toBe(true);
  });
});
