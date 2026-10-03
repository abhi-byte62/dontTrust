import { describe, it, expect } from 'vitest';
import { ScopeEngine } from '@donttrust/scope-engine';
import { SecretRedactor } from '@donttrust/common';

describe('DontTrust CLI Functionality', () => {
  it('evaluates scope constraints correctly', () => {
    const scopeEngine = new ScopeEngine({
      allowedDomains: ['target.local'],
      allowPrivateAddresses: false
    });

    expect(scopeEngine.isAllowed('http://target.local/api')).toBe(true);
    expect(scopeEngine.isAllowed('http://127.0.0.1/admin')).toBe(false);
  });

  it('redacts tokens via CLI utility', () => {
    const output = SecretRedactor.redact('Authorization: Bearer secret_bearer_token_xyz');
    expect(output).toContain('[REDACTED_AUTH_TOKEN]');
  });
});
