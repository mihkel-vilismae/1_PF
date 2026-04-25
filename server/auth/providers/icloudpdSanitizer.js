const GENERIC_SECRET_PATTERNS = [
  /(password\s*[:=]\s*)([^\s]+)/gi,
  /(2fa\s*(?:code)?\s*[:=]\s*)(\d{4,8})/gi,
  /(verification\s*code\s*[:=]\s*)(\d{4,8})/gi,
  /(token\s*[:=]\s*)([^\s]+)/gi,
  /(cookie\s*[:=]\s*)([^\s]+)/gi,
  /(session\s*[:=]\s*)([^\s]+)/gi,
];

export function sanitizeIcloudpdText(text, secrets = {}) {
  let sanitized = String(text || '');
  const valuesToRedact = [
    secrets.username,
    secrets.password,
    secrets.twoFactorCode,
    secrets.cookieDir,
    secrets.downloadDir,
    secrets.sessionPath,
  ].filter((value) => typeof value === 'string' && value.length > 0);

  for (const value of valuesToRedact) {
    sanitized = sanitized.split(value).join('[redacted]');
  }

  for (const pattern of GENERIC_SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '$1[redacted]');
  }

  return sanitized;
}

export function redactedEmail(value) {
  if (!value || typeof value !== 'string' || !value.includes('@')) {
    return null;
  }
  const [name, domain] = value.split('@');
  const safeName = name.length <= 2 ? `${name[0] || '*'}***` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
}
