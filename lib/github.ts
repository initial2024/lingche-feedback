import { githubConfig } from './config';

function githubHeaders() {
  if (!githubConfig.token) throw new Error('GITHUB_TOKEN 未配置。');
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${githubConfig.token}`,
    'X-GitHub-Api-Version': githubConfig.apiVersion,
    'User-Agent': 'lingche-feedback-site',
  };
}

function repoBase() {
  if (!githubConfig.owner || !githubConfig.repo) throw new Error('GITHUB_OWNER / GITHUB_REPO 未配置。');
  return `https://api.github.com/repos/${encodeURIComponent(githubConfig.owner)}/${encodeURIComponent(githubConfig.repo)}`;
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

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    throw new Error(data?.message || `GitHub issue 创建失败：HTTP ${res.status}`);
  }

  return data;
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

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || `GitHub issue 列表读取失败：HTTP ${res.status}`);
  return Array.isArray(data) ? data : [];
}
