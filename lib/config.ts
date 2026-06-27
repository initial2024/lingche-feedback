export function env(name: string, fallback = ''): string {
  const value = process.env[name];
  return value === undefined || value === null || value === '' ? fallback : value;
}

export function envInt(name: string, fallback: number): number {
  const n = Number(env(name));
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export function envBool(name: string, fallback = false): boolean {
  const v = env(name).trim().toLowerCase();
  if (!v) return fallback;
  return ['1', 'true', 'yes', 'on', 'required'].includes(v);
}

export const siteConfig = {
  siteName: env('PUBLIC_SITE_NAME', '灵澈反馈站'),
  baseUrl: env('PUBLIC_BASE_URL', 'https://lcfeedback.ccwu.cc'),
  downloadPageUrl: env('DOWNLOAD_PAGE_URL', 'https://kz26.bbroot.com'),
};

export const githubConfig = {
  owner: env('GITHUB_OWNER'),
  repo: env('GITHUB_REPO'),
  token: env('GITHUB_TOKEN'),
  apiVersion: env('GITHUB_API_VERSION', '2022-11-28'),
  feedbackLabel: env('FEEDBACK_LABEL', 'lingche-feedback'),
};

export const securityConfig = {
  adminToken: env('ADMIN_TOKEN'),
  maxFeedbackBytes: envInt('MAX_FEEDBACK_BYTES', 51200),
  maxFeedbackPerHour: envInt('MAX_FEEDBACK_PER_HOUR', 5),
};
