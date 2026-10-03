import { JobEnvelope, jobBroker } from '@aegisscan/scanner-sdk';
import { Logger, SecretRedactor, Hasher } from '@aegisscan/common';
import { AuthRole, HttpMethod } from '@aegisscan/protocol-models';

export interface IdentityProfile {
  identityId: string;
  role: AuthRole;
  headers: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface AuthMatrixJobPayload {
  endpointPath: string;
  httpMethod: HttpMethod;
  identities: IdentityProfile[];
  baseUrl: string;
  resourceIdTested?: string;
}

export type AuthIssueType =
  | 'HORIZONTAL_IDOR'
  | 'VERTICAL_PRIVILEGE_ESCALATION'
  | 'UNAUTHENTICATED_ACCESS'
  | 'MISSING_FUNCTION_LEVEL_AUTH';

export interface AuthorizationHypothesis {
  hypothesisId: string;
  issueType: AuthIssueType;
  endpointUrl: string;
  path: string;
  method: HttpMethod;
  violatingIdentity: string;
  privilegedIdentity?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceDescription: string;
  sanitizedExchange: {
    requestHeaders: Record<string, string>;
    responseStatusCode: number;
    responseSnippet: string;
  };
}

export interface AuthorizationAnalysisResult {
  endpointPath: string;
  httpMethod: HttpMethod;
  roleAccess: Record<string, {
    accessible: boolean;
    statusCode: number;
    responseLength: number;
    anomalyDetected: boolean;
    evidence?: string;
  }>;
  hypotheses: AuthorizationHypothesis[];
}

export class AuthorizationComparator {
  /**
   * Evaluates responses across multiple identities to discover horizontal and vertical privilege anomalies.
   */
  public static compareIdentities(
    endpointPath: string,
    httpMethod: HttpMethod,
    baseUrl: string,
    identities: IdentityProfile[],
    responses: Array<{ identity: IdentityProfile; statusCode: number; body: string; headers: Record<string, string> }>
  ): AuthorizationAnalysisResult {
    const roleAccess: AuthorizationAnalysisResult['roleAccess'] = {};
    const hypotheses: AuthorizationHypothesis[] = [];
    const fullUrl = new URL(endpointPath, baseUrl).toString();

    for (const r of responses) {
      const accessible = r.statusCode >= 200 && r.statusCode < 300;
      roleAccess[r.identity.role] = {
        accessible,
        statusCode: r.statusCode,
        responseLength: r.body.length,
        anomalyDetected: false
      };
    }

    const anonResp = responses.find(r => r.identity.role === 'ANONYMOUS');
    const userResp = responses.find(r => r.identity.role === 'USER');
    const adminResp = responses.find(r => r.identity.role === 'ADMIN');
    const userAResp = responses.find(r => r.identity.identityId === 'user-a');
    const userBResp = responses.find(r => r.identity.identityId === 'user-b');

    // 1. Check Unauthenticated Access on Privileged or User endpoints
    if (anonResp && anonResp.statusCode >= 200 && anonResp.statusCode < 300) {
      if (endpointPath.includes('/admin') || endpointPath.includes('/manage') || endpointPath.includes('/settings')) {
        roleAccess['ANONYMOUS'].anomalyDetected = true;
        roleAccess['ANONYMOUS'].evidence = 'Unauthenticated access permitted on administrative resource';

        hypotheses.push({
          hypothesisId: `hyp-auth-${Hasher.sha256(endpointPath + 'anon').substring(0, 12)}`,
          issueType: 'UNAUTHENTICATED_ACCESS',
          endpointUrl: fullUrl,
          path: endpointPath,
          method: httpMethod,
          violatingIdentity: 'anonymous',
          confidence: 'HIGH',
          evidenceDescription: `Unauthenticated request returned ${anonResp.statusCode} OK on administrative endpoint ${endpointPath}`,
          sanitizedExchange: {
            requestHeaders: SecretRedactor.redactHeaders(anonResp.identity.headers),
            responseStatusCode: anonResp.statusCode,
            responseSnippet: anonResp.body.substring(0, 200)
          }
        });
      }
    }

    // 2. Check Vertical Privilege Escalation (User accessing Admin endpoint)
    if (userResp && adminResp && userResp.statusCode >= 200 && userResp.statusCode < 300 && adminResp.statusCode >= 200 && adminResp.statusCode < 300) {
      if (endpointPath.includes('/admin') || endpointPath.includes('/roles') || endpointPath.includes('/super')) {
        roleAccess['USER'].anomalyDetected = true;
        roleAccess['USER'].evidence = 'Standard user granted access to administrative endpoint';

        hypotheses.push({
          hypothesisId: `hyp-vert-${Hasher.sha256(endpointPath + 'user-admin').substring(0, 12)}`,
          issueType: 'VERTICAL_PRIVILEGE_ESCALATION',
          endpointUrl: fullUrl,
          path: endpointPath,
          method: httpMethod,
          violatingIdentity: userResp.identity.identityId,
          privilegedIdentity: adminResp.identity.identityId,
          confidence: 'HIGH',
          evidenceDescription: `Standard user '${userResp.identity.identityId}' received ${userResp.statusCode} on admin route ${endpointPath}`,
          sanitizedExchange: {
            requestHeaders: SecretRedactor.redactHeaders(userResp.identity.headers),
            responseStatusCode: userResp.statusCode,
            responseSnippet: userResp.body.substring(0, 200)
          }
        });
      }
    }

    // 3. Check Horizontal IDOR / BOLA (User B accessing User A resource)
    if (userAResp && userBResp && userBResp.statusCode >= 200 && userBResp.statusCode < 300) {
      // If user B received identical non-empty record that belongs to user A
      if (userBResp.body.length > 20 && userAResp.body === userBResp.body) {
        hypotheses.push({
          hypothesisId: `hyp-idor-${Hasher.sha256(endpointPath + 'user-b').substring(0, 12)}`,
          issueType: 'HORIZONTAL_IDOR',
          endpointUrl: fullUrl,
          path: endpointPath,
          method: httpMethod,
          violatingIdentity: 'user-b',
          privilegedIdentity: 'user-a',
          confidence: 'HIGH',
          evidenceDescription: `User B accessed resource data belonging to User A at ${endpointPath} without authorization denial`,
          sanitizedExchange: {
            requestHeaders: SecretRedactor.redactHeaders(userBResp.identity.headers),
            responseStatusCode: userBResp.statusCode,
            responseSnippet: userBResp.body.substring(0, 200)
          }
        });
      }
    }

    return {
      endpointPath,
      httpMethod,
      roleAccess,
      hypotheses
    };
  }
}

export class AuthAnalyzerWorker {
  private logger = new Logger('AuthAnalyzerWorker');
  private workerId = `auth-analyzer-${crypto.randomUUID()}`;

  public async processJob(job: JobEnvelope<AuthMatrixJobPayload>): Promise<AuthorizationAnalysisResult> {
    const { endpointPath, httpMethod, identities, baseUrl } = job.payload;
    const fullUrl = new URL(endpointPath, baseUrl).toString();

    this.logger.info(`Analyzing multi-role authorization for: ${httpMethod} ${endpointPath}`, {
      jobId: job.jobId,
      identitiesCount: identities.length
    });

    const responses: Array<{ identity: IdentityProfile; statusCode: number; body: string; headers: Record<string, string> }> = [];

    for (const identity of identities) {
      try {
        const res = await fetch(fullUrl, {
          method: httpMethod,
          headers: identity.headers
        });
        const body = await res.text();
        const headerMap: Record<string, string> = {};
        res.headers.forEach((v, k) => { headerMap[k] = v; });

        responses.push({
          identity,
          statusCode: res.status,
          body,
          headers: headerMap
        });
      } catch (err: any) {
        responses.push({
          identity,
          statusCode: 0,
          body: '',
          headers: {}
        });
      }
    }

    return AuthorizationComparator.compareIdentities(
      endpointPath,
      httpMethod,
      baseUrl,
      identities,
      responses
    );
  }

  public startPolling(): void {
    setInterval(async () => {
      jobBroker.heartbeat(this.workerId, 'aegis.auth-analysis');
      await jobBroker.executeJob<AuthMatrixJobPayload, AuthorizationAnalysisResult>(
        'aegis.auth-analysis',
        this.workerId,
        (job) => this.processJob(job)
      );
    }, 500);
  }
}
