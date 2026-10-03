import { describe, it, expect } from 'vitest';
import { AuthorizationComparator, IdentityProfile } from '../src/index.js';

describe('AuthorizationComparator & Multi-Identity Analysis', () => {
  const identities: IdentityProfile[] = [
    { identityId: 'anonymous', role: 'ANONYMOUS', headers: {} },
    { identityId: 'user-a', role: 'USER', headers: { Authorization: 'Bearer token_user_a' } },
    { identityId: 'user-b', role: 'USER', headers: { Authorization: 'Bearer token_user_b' } },
    { identityId: 'admin', role: 'ADMIN', headers: { Authorization: 'Bearer token_admin' } }
  ];

  it('detects vertical privilege escalation when standard user accesses admin endpoint', () => {
    const responses = [
      { identity: identities[0], statusCode: 401, body: 'Unauthorized', headers: {} },
      { identity: identities[1], statusCode: 200, body: '{"adminSettings": true}', headers: {} },
      { identity: identities[3], statusCode: 200, body: '{"adminSettings": true}', headers: {} }
    ];

    const result = AuthorizationComparator.compareIdentities(
      '/api/v1/admin/users',
      'GET',
      'http://app.target.local',
      identities,
      responses
    );

    expect(result.roleAccess['USER'].anomalyDetected).toBe(true);
    expect(result.hypotheses.some(h => h.issueType === 'VERTICAL_PRIVILEGE_ESCALATION')).toBe(true);
  });

  it('detects horizontal IDOR when user-b accesses user-a private resource', () => {
    const responses = [
      { identity: identities[1], statusCode: 200, body: '{"accountId": "1001", "balance": 50000}', headers: {} },
      { identity: identities[2], statusCode: 200, body: '{"accountId": "1001", "balance": 50000}', headers: {} }
    ];

    const result = AuthorizationComparator.compareIdentities(
      '/api/v1/account/1001/statement',
      'GET',
      'http://app.target.local',
      identities,
      responses
    );

    expect(result.hypotheses.some(h => h.issueType === 'HORIZONTAL_IDOR')).toBe(true);
    expect(result.hypotheses[0].violatingIdentity).toBe('user-b');
  });
});
