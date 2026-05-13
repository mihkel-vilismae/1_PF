/*
 * Shares frontend NEW AUTH redaction helpers across state sanitizers and modal rendering.
 * Keeps provider communication safe before it reaches logs, history, or visible terminal panels.
 */

// Performs a final frontend redaction pass for provider communication text.
export function sanitizeNewAuthProviderText(value: unknown): string {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => redactEmailForDisplay(email))
    .replace(/\b\d{6,8}\b/g, '[redacted-code]')
    .replace(/((?:password|passwd|authorization|bearer|token|cookie|session|secret)\s*[:=]\s*)([^\s]+)/gi, '$1[redacted]')
    .replace(/(Authorization:\s*)(.+)/gi, '$1[redacted]')
    .replace(/(Cookie:\s*)(.+)/gi, '$1[redacted]');
}

// Redacts an email address while preserving a recognizable account shape.
export function redactEmailForDisplay(email: string): string {
  const [name, domain] = email.split('@');
  const prefix = name.length <= 2 ? `${name[0] ?? '*'}***` : `${name.slice(0, 2)}***`;
  return `${prefix}@${domain}`;
}
