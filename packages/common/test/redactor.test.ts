import { describe, it, expect } from 'vitest';
import { SecretRedactor, Hasher } from '../src/index.js';

describe('SecretRedactor', () => {
  it('redacts Bearer and Basic authorization headers', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';
    const redacted = SecretRedactor.redact(input);
    expect(redacted).not.toContain('eyJhbGciOiJIUzI1Ni');
    expect(redacted).toContain('[REDACTED_AUTH_TOKEN]');
  });

  it('redacts AWS keys and private key blocks', () => {
    const awsKey = 'AKIAIOSFODNN7EXAMPLE';
    expect(SecretRedactor.redact(`aws_key=${awsKey}`)).toContain('[REDACTED_AWS_KEY]');

    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0\n-----END RSA PRIVATE KEY-----';
    expect(SecretRedactor.redact(pem)).toBe('[REDACTED_PRIVATE_KEY_BLOCK]');
  });

  it('redacts session cookies', () => {
    const cookieHeader = 'Cookie: session=secret_session_token_12345; user=alice';
    const redacted = SecretRedactor.redact(cookieHeader);
    expect(redacted).toContain('session=[REDACTED_COOKIE]');
  });
});

describe('Hasher', () => {
  it('generates consistent sha256 fingerprints', () => {
    const fp1 = Hasher.calculateFindingFingerprint({
      targetHost: 'example.com',
      endpointPath: '/api/v1/users',
      httpMethod: 'GET',
      ruleId: 'cors-misconfig'
    });
    const fp2 = Hasher.calculateFindingFingerprint({
      targetHost: 'EXAMPLE.COM ',
      endpointPath: '/api/v1/users',
      httpMethod: 'get',
      ruleId: 'cors-misconfig'
    });
    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64);
  });
});
