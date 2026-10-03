import { describe, it, expect } from 'vitest';
import { ApplicationModel } from '../src/index.js';
import { FindingBuilder } from '@aegisscan/finding-schema';

describe('Application Intelligence Model', () => {
  it('creates an application model, incrementally adds endpoints and merges parameters', () => {
    const model = new ApplicationModel('target-1', 'http://app.target.local:8080');
    expect(model.host).toBe('app.target.local');

    // Add endpoint initially
    const ep1 = model.addEndpoint({
      url: 'http://app.target.local:8080/api/v1/users',
      host: 'app.target.local',
      path: '/api/v1/users',
      method: 'GET',
      parameters: [{ name: 'page', in: 'query' }],
      authRequired: false,
      observedStatusCodes: [200],
      provenance: {
        source: 'CRAWLER',
        discoveredAt: new Date().toISOString()
      }
    });

    expect(ep1.id).toBe('GET:app.target.local:/api/v1/users');
    expect(model.listEndpoints().length).toBe(1);

    // Incrementally discover new parameter and status code for the same endpoint
    model.addEndpoint({
      url: 'http://app.target.local:8080/api/v1/users',
      host: 'app.target.local',
      path: '/api/v1/users',
      method: 'GET',
      parameters: [{ name: 'limit', in: 'query' }],
      authRequired: true,
      observedStatusCodes: [401],
      provenance: {
        source: 'BROWSER',
        discoveredAt: new Date().toISOString()
      }
    });

    const updatedEp = model.getEndpoint('GET:app.target.local:/api/v1/users');
    expect(updatedEp?.parameters.length).toBe(2);
    expect(updatedEp?.observedStatusCodes).toEqual([200, 401]);
    expect(updatedEp?.authRequired).toBe(true);
  });

  it('manages security hypothesis lifecycle from candidate to promoted finding', () => {
    const model = new ApplicationModel('target-1', 'http://app.target.local:8080');

    // 1. Create candidate hypothesis
    const hyp = model.addHypothesis({
      ruleId: 'IDOR_CHECK',
      title: 'Potential Insecure Direct Object Reference on User Profile',
      category: 'AUTHORIZATION',
      potentialSeverity: 'HIGH',
      initialConfidence: 'TENTATIVE',
      target: {
        url: 'http://app.target.local:8080/api/v1/user/10',
        host: 'app.target.local',
        path: '/api/v1/user/10',
        method: 'GET',
        parameter: 'id'
      },
      hypothesisReason: 'Sequential integer ID observed in path parameter',
      verificationStrategy: 'Cross-identity access check with user-b identity token',
      supportingEvidence: ['Integer ID 10 returned JSON user profile without CSRF token'],
      provenance: {
        source: 'API_SPEC',
        discoveredAt: new Date().toISOString()
      }
    });

    expect(hyp.status).toBe('CANDIDATE');

    // 2. Transition hypothesis to verified
    model.updateHypothesisStatus(hyp.id, 'VERIFIED', 'User B was able to view User A record with 200 OK');
    expect(model.listHypotheses()[0].status).toBe('VERIFIED');

    // 3. Promote hypothesis to real finding
    const finding = new FindingBuilder()
      .setProject('proj-1', 'scan-1')
      .setRule('IDOR_CHECK')
      .setTarget('app.target.local', '/api/v1/user/10', 'GET', 'id')
      .setClassification('IDOR on User Profile', 'AUTHORIZATION', 'HIGH', 'CONFIRMED')
      .setNarrative('IDOR confirmed', 'Data leak', 'Enforce authorization')
      .build();

    model.promoteHypothesisToFinding(hyp.id, finding);
    expect(model.listHypotheses()[0].status).toBe('PROMOTED_TO_FINDING');
    expect(model.listFindings().length).toBe(1);
    expect(model.listFindings()[0].id).toBe(finding.id);
  });

  it('supports full snapshot export and import serialization', () => {
    const model = new ApplicationModel('target-1', 'http://app.target.local:8080');
    model.addTechnology({
      name: 'Express',
      category: 'FRAMEWORK',
      confidence: 'HIGH',
      evidence: 'X-Powered-By: Express'
    });

    const snapshot = model.exportSnapshot();
    expect(snapshot.technologies.length).toBe(1);
    expect(snapshot.technologies[0].name).toBe('Express');

    const restoredModel = new ApplicationModel('target-2', 'http://restored.local');
    restoredModel.importSnapshot(snapshot);
    expect(restoredModel.listTechnologies().length).toBe(1);
    expect(restoredModel.listTechnologies()[0].name).toBe('Express');
  });
});
