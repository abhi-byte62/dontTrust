export type AuthRole = 'ANONYMOUS' | 'USER_A' | 'USER_B' | 'ADMIN' | 'CUSTOM';

export interface AuthProfile {
  id: string;
  name: string;
  role: AuthRole;
  authType: 'BEARER_TOKEN' | 'COOKIE_SESSION' | 'API_KEY_HEADER' | 'CUSTOM_HEADERS';
  headers: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface AuthorizationMatrixEntry {
  endpointPath: string;
  httpMethod: string;
  roleAccess: Record<AuthRole, {
    accessible: boolean;
    statusCode: number;
    responseLength: number;
    anomalyDetected: boolean;
    evidence?: string;
  }>;
}
