export type AdminTokenShape = {
  rawLength: number;
  trimmedLength: number;
  normalizedLength: number;
  hadLeadingOrTrailingWhitespace: boolean;
  hadAdminTokenPrefix: boolean;
  hadWrappingQuotes: boolean;
  hadNewline: boolean;
  isEmptyAfterNormalize: boolean;
};

type AdminTokenAnalysis = AdminTokenShape & {
  normalized: string;
};

export function analyzeAdminToken(input: string | null | undefined): AdminTokenAnalysis {
  const raw = input || '';
  const trimmed = raw.trim();
  const normalized = trimmed.replace(/^ADMIN_TOKEN\s*=\s*/i, '').trim();

  return {
    rawLength: raw.length,
    trimmedLength: trimmed.length,
    normalizedLength: normalized.length,
    hadLeadingOrTrailingWhitespace: raw !== trimmed,
    hadAdminTokenPrefix: /^ADMIN_TOKEN\s*=\s*/i.test(trimmed),
    hadWrappingQuotes:
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")),
    hadNewline: /[\r\n]/.test(raw),
    isEmptyAfterNormalize: normalized.length === 0,
    normalized,
  };
}

export function normalizeAdminToken(input: string | null | undefined): string {
  return analyzeAdminToken(input).normalized;
}

export function getAdminTokenShape(input: string | null | undefined): AdminTokenShape {
  const { normalized: _normalized, ...shape } = analyzeAdminToken(input);
  return shape;
}
