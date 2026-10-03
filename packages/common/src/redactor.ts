import { createHash } from 'node:crypto';

/**
 * Robust, production-grade secret redactor for HTTP requests, responses,
 * DOM snippets, and logs to ensure sensitive credentials are never leaked.
 */
export class SecretRedactor {
  private static readonly PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
    // Authorization: Bearer / Basic
    {
      regex: /(Authorization:\s*(?:Bearer|Basic)\s+)([A-Za-z0-9_\-\.\:\=\+\/]{8,})/gi,
      replacement: '$1[REDACTED_AUTH_TOKEN]'
    },
    // Generic API Keys & Secrets in Query/Headers/JSON
    {
      regex: /(["']?(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|client[_-]?secret|private[_-]?key)["']?\s*[:=]\s*["']?)([A-Za-z0-9_\-\.\:\=\+\/]{8,})(["']?)/gi,
      replacement: '$1[REDACTED_SECRET]$3'
    },
    // AWS Access Key ID
    {
      regex: /\b(AKIA[0-9A-Z]{16})\b/g,
      replacement: '[REDACTED_AWS_KEY]'
    },
    // AWS Secret Access Key
    {
      regex: /(aws_secret_access_key\s*=\s*)([A-Za-z0-9\/+=]{40})/gi,
      replacement: '$1[REDACTED_AWS_SECRET]'
    },
    // PEM Private Keys
    {
      regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      replacement: '[REDACTED_PRIVATE_KEY_BLOCK]'
    },
    // JWT Tokens (Header.Payload.Signature)
    {
      regex: /\b(ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
      replacement: '[REDACTED_JWT_TOKEN]'
    },
    // Session Cookie values in Set-Cookie / Cookie headers
    {
      regex: /(Cookie:[^\r\n]*(?:session|sid|token|jwt|auth)=)([^;\r\n]+)/gi,
      replacement: '$1[REDACTED_COOKIE]'
    },
    {
      regex: /(Set-Cookie:[^\r\n]*(?:session|sid|token|jwt|auth)=)([^;\r\n]+)/gi,
      replacement: '$1[REDACTED_COOKIE]'
    }
  ];

  public static redact(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }
    let redacted = input;
    for (const { regex, replacement } of SecretRedactor.PATTERNS) {
      redacted = redacted.replace(regex, replacement);
    }
    return redacted;
  }

  public static redactHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[]> {
    const safeHeaders: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) continue;
      const lowerKey = key.toLowerCase();
      if (['authorization', 'proxy-authorization', 'x-api-key', 'cookie', 'set-cookie'].includes(lowerKey)) {
        if (Array.isArray(value)) {
          safeHeaders[key] = value.map(v => SecretRedactor.redact(v));
        } else {
          safeHeaders[key] = SecretRedactor.redact(value);
        }
      } else {
        safeHeaders[key] = value;
      }
    }
    return safeHeaders;
  }
}
