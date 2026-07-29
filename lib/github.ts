import { githubConfig } from './config';

export class GitHubApiError extends Error {
  status: number;
  code: string;
  githubMessage: string;

  constructor(status: number, githubMessage: string, explicitCode?: string) {
    const code = explicitCode || (
      status === 401 && githubMessage === 'Bad credentials'
        ? 'github_token_bad_credentials'
        : status === 403
          ? 'github_token_forbidden'
          : status === 404
            ? 'github_repo_not_found_or_no_access'
            : 'github_api_error'
    );
    const message = code === 'github_token_bad_credentials'
      ? 'GitHub Token 无效或已过期，请检查 Vercel Production 的 GITHUB_TOKEN。'
      : code === 'github_token_forbidden'
        ? 'GitHub Token 权限不足或被限制，请检查 Issues 读写权限。'
        : code === 'github_repo_not_found_or_no_access'
          ? 'GitHub 仓库不存在或 Token 无权访问该仓库。'
          : code === 'github_token_not_configured'
            ? '服务端未配置 GITHUB_TOKEN，请检查 Vercel Production 环境变量。'
            : code === 'github_repo_config_missing'
              ? 'GitHub 仓库配置缺失，请检查 GITHUB_OWNER / GITHUB_REPO。'
              : githubMessage || `GitHub API 请求失败：HTTP ${status}`;

    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.code = code;
    this.githubMessage = githubMessage;
  }
}

function githubHeaders() {
  if (!githubConfig.token.trim()) throw new GitHubApiError(0, '', 'github_token_not_configured');
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${githubConfig.token}`,
    'X-GitHub-Api-Version': githubConfig.apiVersion,
    'User-Agent': 'lingche-feedback-site',
  };
}

function repoBase() {
  if (!githubConfig.owner.trim() || !githubConfig.repo.trim()) {
    throw new GitHubApiError(0, '', 'github_repo_config_missing');
  }
  return `https://api.github.com/repos/${encodeURIComponent(githubConfig.owner)}/${encodeURIComponent(githubConfig.repo)}`;
}

async function parseGitHubResponse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new GitHubApiError(res.status, data?.message || '');
  return data;
}

export async function createFeedbackIssue(input: {
  title: string;
  body: string;
  labels?: string[];
}) {
  const url = `${repoBase()}/issues`;
  const basePayload = {
    title: input.title,
    body: input.body,
    labels: input.labels?.filter(Boolean) || [],
  };

  let res = await fetch(url, {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify(basePayload),
  });

  // 如果仓库没有预建 label，部分情况下可能失败；兜底不带 label 再试一次。
  if (!res.ok && basePayload.labels.length) {
    res = await fetch(url, {
      method: 'POST',
      headers: githubHeaders(),
      body: JSON.stringify({ title: input.title, body: input.body }),
    });
  }

  return parseGitHubResponse(res);
}

export async function listFeedbackIssues(state = 'open', perPage = 20) {
  const url = new URL(`${repoBase()}/issues`);
  url.searchParams.set('state', state);
  url.searchParams.set('per_page', String(Math.max(1, Math.min(perPage, 50))));
  if (githubConfig.feedbackLabel) url.searchParams.set('labels', githubConfig.feedbackLabel);

  let res = await fetch(url.toString(), {
    method: 'GET',
    headers: githubHeaders(),
    cache: 'no-store',
  });

  // label 未创建时，兜底列出仓库 issue。
  if (!res.ok && githubConfig.feedbackLabel) {
    const fallback = new URL(`${repoBase()}/issues`);
    fallback.searchParams.set('state', state);
    fallback.searchParams.set('per_page', String(Math.max(1, Math.min(perPage, 50))));
    res = await fetch(fallback.toString(), { method: 'GET', headers: githubHeaders(), cache: 'no-store' });
  }

  const data = await parseGitHubResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function probeGitHubRepo() {
  const res = await fetch(repoBase(), {
    method: 'GET',
    headers: githubHeaders(),
    cache: 'no-store',
  });
  await parseGitHubResponse(res);
  return true;
}
