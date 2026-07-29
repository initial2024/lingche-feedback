import { NextResponse } from 'next/server';
import { analyzeAdminToken, getAdminTokenShape } from '@/lib/admin-token';
import { securityConfig } from '@/lib/config';
import { GitHubApiError, listFeedbackIssues } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headerToken = request.headers.get('x-admin-token');
  const rawToken = headerToken || '';
  const received = analyzeAdminToken(rawToken);
  const server = analyzeAdminToken(securityConfig.adminToken || '');
  const token = received.normalized;
  const expected = server.normalized;

  if (!expected) {
    return NextResponse.json({
      ok: false,
      error_code: 'admin_token_not_configured',
      error: '服务端未配置 ADMIN_TOKEN，请检查 Vercel Production 环境变量。',
    }, { status: 503 });
  }

  if (!token) {
    return NextResponse.json({
      ok: false,
      error_code: 'admin_token_missing',
      error: '请输入管理员 Token。',
    }, { status: 401 });
  }

  if (token !== expected) {
    return NextResponse.json({
      ok: false,
      error_code: 'admin_token_mismatch',
      error: '管理员 Token 不匹配。请确认使用的是 Vercel Production 的 ADMIN_TOKEN。',
      diagnostic: {
        serverTokenConfigured: true,
        headerPresent: headerToken !== null,
        server: getAdminTokenShape(securityConfig.adminToken || ''),
        received: getAdminTokenShape(rawToken),
        normalizedLengthEqual: server.normalizedLength === received.normalizedLength,
        normalizedMatch: false,
      },
    }, { status: 401 });
  }

  const url = new URL(request.url);
  const state = url.searchParams.get('state') || 'open';
  const perPage = Number(url.searchParams.get('perPage') || 20);

  try {
    const issues = await listFeedbackIssues(state, perPage);
    return NextResponse.json({
      ok: true,
      issues: issues.map((item: any) => ({
        number: item.number,
        title: item.title,
        state: item.state,
        url: item.html_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        labels: Array.isArray(item.labels) ? item.labels.map((l: any) => l.name || l) : [],
      })),
    });
  } catch (error: any) {
    if (error instanceof GitHubApiError) {
      const status = error.code === 'github_token_not_configured' || error.code === 'github_repo_config_missing' ? 503 : 502;
      return NextResponse.json({
        ok: false,
        error_code: error.code,
        error: error.message,
        diagnostic: {
          adminAuthPassed: true,
          githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN?.trim()),
          githubOwnerConfigured: Boolean(process.env.GITHUB_OWNER?.trim()),
          githubRepoConfigured: Boolean(process.env.GITHUB_REPO?.trim()),
          githubApiStatus: error.status || null,
          githubMessage: error.githubMessage || null,
        },
      }, { status });
    }

    return NextResponse.json({ ok: false, error_code: 'github_api_error', error: String(error?.message || error) }, { status: 502 });
  }
}
