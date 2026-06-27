const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[A-Za-z0-9._\-+/=]{12,}/gi, 'Bearer [redacted]'],
  [/(sk-[A-Za-z0-9_\-]{12,})/gi, '[redacted-openai-key]'],
  [/(nvapi-[A-Za-z0-9_\-]{12,})/gi, '[redacted-nvidia-key]'],
  [/(tvly-[A-Za-z0-9_\-]{12,})/gi, '[redacted-tavily-key]'],
  [/((?:api[_-]?key|apikey|authorization|cookie|x-api-key|search_api_key|openai_api_key|nvidia_api_key|tavily_api_key)\s*[:=]\s*)[^\s,;}\]]+/gi, '$1[redacted]'],
  [/([A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{16,})/g, '[redacted-token]'],
];

export function sanitizeText(input: unknown): string {
  let text = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  if (!text) return '';
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

export function safeJson(value: unknown, maxChars: number): string {
  const text = sanitizeText(value);
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n\n[已截断，原始内容过长]` : text;
}

export function inferLevel(payload: any): 'info' | 'warning' | 'error' {
  const raw = JSON.stringify(payload || '').toLowerCase();
  if (raw.includes('error') || raw.includes('failed') || raw.includes('失败') || raw.includes('异常')) return 'error';
  if (raw.includes('warning') || raw.includes('warn') || raw.includes('警告') || raw.includes('未配置')) return 'warning';
  return 'info';
}

export function inferVersion(payload: any): string {
  return String(payload?.appVersion || payload?.report?.app?.version || payload?.version || 'unknown');
}
