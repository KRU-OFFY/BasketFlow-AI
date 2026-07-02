const SENSITIVE_ASSIGNMENT =
  /((?:authorization|password|token|api[_-]?key|secret)["']?\s*(?:=|:)\s*["']?)([^&\s,"'}]+)/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function redactSensitiveText(value: string) {
  return value
    .replace(SENSITIVE_ASSIGNMENT, '$1[REDACTED]')
    .replace(JWT, '[REDACTED_JWT]')
    .replace(EMAIL, '[REDACTED_EMAIL]');
}
