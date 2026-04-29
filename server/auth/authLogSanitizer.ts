const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /^pw$/i,
  /token/i,
  /cookie/i,
  /secret/i,
  /session/i,
  /authorization/i,
  /two[_-]?factor[_-]?(code|value|raw|token)/i,
  /^otp$/i,
];

const REDACTED_VALUE = '[redacted]';

type SanitizableObject = Record<string, unknown>;

export function sanitizeAuthValue<T>(value: T): T {
  return sanitizeUnknown(value, new WeakSet<object>()) as T;
}

function sanitizeUnknown(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeUnknown(entry, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[circular]';
    }
    seen.add(value);

    const sanitized: SanitizableObject = {};
    for (const [key, childValue] of Object.entries(value)) {
      sanitized[key] = isSensitiveKey(key) ? REDACTED_VALUE : sanitizeUnknown(childValue, seen);
    }
    seen.delete(value);
    return sanitized;
  }

  return value;
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export { REDACTED_VALUE };
