import { NextResponse } from 'next/server';
import { getAdminTokenShape, normalizeAdminToken } from '@/lib/admin-token';
import { githubConfig, securityConfig } from '@/lib/config';
import { GitHubApiError, probeGitHubRepo } from '@/lib/github';

export const dynamic = 'force-dynamic';

function unauthorizedResponse(request: Request) {
  const received = normalizeAdminToken(request.headers.get('x-admin-token') || '');
  const expected = normalizeAdminToken(securityConfig.adminToken || '');

  if (!expected) {
    return NextResponse.json({ ok: false, error_code: 'admin_token_not_configured', error: '服务端未配置 ADMIN_TOKEN。' }, { status: 503 });
  }
  if (!received) {
    return NextResponse.json({ ok: false, error_code: 'admin_token_missing', error: '请输入管理员 Token。' }, { status: 401 });
  }
  if (received !== expected) {
    return NextResponse.json({ ok: false, error_code: 'admin_token_mismatch', error: '管理员 Token 不匹配。' }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  const github = {
    ownerConfigured: Boolean(githubConfig.owner.trim()),
    repoConfigured: Boolean(githubConfig.repo.trim()),
    tokenConfigured: Boolean(githubConfig.token.trim()),
    tokenShape: getAdminTokenShape(githubConfig.token),
    repo: githubConfig.owner && githubConfig.repo ? `${githubConfig.owner}/${githubConfig.repo}` : '',
  };

  if (!github.tokenConfigured) {
    return NextResponse.json({
      ok: false,
      error_code: 'github_token_not_configured',
      error: '服务端未配置 GITHUB_TOKEN，请检查 Vercel Production 环境变量。',
      adminAuthPassed: true,
      github,
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!github.ownerConfigured || !github.repoConfigured) {
    return NextResponse.json({
      ok: false,
      error_code: 'github_repo_config_missing',
      error: 'GitHub 仓库配置缺失，请检查 GITHUB_OWNER / GITHUB_REPO。',
      adminAuthPassed: true,
      github,
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const result: Record<string, unknown> = { ok: true, adminAuthPassed: true, github };
  if (new URL(request.url).searchParams.get('probe') === '1') {
    try {
      await probeGitHubRepo();
      result.probe = { ok: true, status: 200, code: 'ready', message: 'GitHub 仓库可访问。' };
    } catch (error: any) {
      const apiError = error instanceof GitHubApiError ? error : new GitHubApiError(0, String(error?.message || error));
      result.ok = false;
      result.probe = { ok: false, status: apiError.status || null, code: apiError.code, message: apiError.message };
    }
  }

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
