import { NextResponse } from 'next/server';
import { securityConfig } from '@/lib/config';
import { listFeedbackIssues } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = request.headers.get('x-admin-token') || '';
  if (!securityConfig.adminToken || token !== securityConfig.adminToken) {
    return NextResponse.json({ ok: false, error: '未授权。' }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 502 });
  }
}
