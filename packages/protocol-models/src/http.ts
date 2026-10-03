export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
  TRACE: 'TRACE'
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export interface HttpRequest {
  id: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string | string[]>;
  body?: string;
  authContextId?: string;
  timestamp: string;
}

export type HttpRequestModel = HttpRequest;

export interface HttpResponse {
  id: string;
  requestId: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  bodySnippet: string;
  bodyLength: number;
  mimeType?: string;
  responseTimeMs: number;
  timestamp: string;
}

export type HttpResponseModel = HttpResponse;

export interface HttpTransaction {
  id: string;
  request: HttpRequest;
  response: HttpResponse;
  durationMs: number;
  timestamp: string;
}

export interface CookieModel {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None' | 'Unspecified';
  rawHeader: string;
}

export interface FormInputModel {
  name: string;
  type: string;
  value?: string;
  required?: boolean;
}

export interface FormModel {
  id: string;
  pageUrl: string;
  action: string;
  method: HttpMethod;
  inputs: FormInputModel[];
  enctype?: string;
}

export interface TechnologyFingerprint {
  name: string;
  category: 'FRAMEWORK' | 'CMS' | 'WEB_SERVER' | 'CDN' | 'JS_LIB' | 'PROGRAMMING_LANGUAGE' | 'DATABASE' | 'SECURITY';
  version?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string;
}
