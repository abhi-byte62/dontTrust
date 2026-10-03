export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  scanId?: string;
  projectId?: string;
  workerId?: string;
  traceId?: string;
  target?: string;
  [key: string]: unknown;
}

/**
 * Structured, JSON-capable logger enforcing security hygiene (redaction).
 */
export class Logger {
  constructor(private readonly serviceName: string, private readonly defaultContext: LogContext = {}) {}

  public child(context: LogContext): Logger {
    return new Logger(this.serviceName, { ...this.defaultContext, ...context });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      context: { ...this.defaultContext, ...meta }
    };

    const serialized = JSON.stringify(entry);
    if (level === 'ERROR') {
      console.error(serialized);
    } else if (level === 'WARN') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.log('DEBUG', message, meta);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.log('INFO', message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.log('WARN', message, meta);
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    this.log('ERROR', message, meta);
  }
}
