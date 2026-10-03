export enum ErrorCode {
  SCOPE_VIOLATION = 'SCOPE_VIOLATION',
  SSRF_ATTEMPT_DETECTED = 'SSRF_ATTEMPT_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TARGET_TIMEOUT = 'TARGET_TIMEOUT',
  TARGET_UNREACHABLE = 'TARGET_UNREACHABLE',
  INVALID_SCAN_STATE = 'INVALID_SCAN_STATE',
  RULE_EXECUTION_ERROR = 'RULE_EXECUTION_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PAYLOAD_SIZE_EXCEEDED = 'PAYLOAD_SIZE_EXCEEDED'
}

export class AegisError extends Error {
  public readonly code: ErrorCode;
  public readonly correlationId?: string;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(params: {
    code: ErrorCode;
    message: string;
    correlationId?: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
    cause?: Error;
  }) {
    super(params.message);
    this.name = 'AegisError';
    this.code = params.code;
    this.correlationId = params.correlationId;
    this.details = params.details;
    this.retryable = params.retryable ?? false;
    if (params.cause) {
      this.cause = params.cause;
    }
  }
}
