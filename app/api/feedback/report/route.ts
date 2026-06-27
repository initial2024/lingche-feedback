import { NextResponse } from 'next/server';
import { githubConfig, securityConfig } from '@/lib/config';
import { createFeedbackIssue } from '@/lib/github';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { inferLevel, inferVersion, safeJson, sanitizeText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`feedback:${ip}`, securityConfig.maxFeedbackPerHour);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: '提交过于频繁，请稍后再试。' }, { status: 429 });
  }

  const raw = await request.text();
  const byteSize = new TextEncoder().encode(raw).length;
  if (byteSize > securityConfig.maxFeedbackBytes) {
    return NextResponse.json({ ok: false, error: `反馈内容过大，限制 ${securityConfig.maxFeedbackBytes} bytes。` }, { status: 413 });
  }

  let payload: any;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ ok: false, error: '请求体不是合法 JSON。' }, { status: 400 });
  }

  const level = inferLevel(payload);
  const version = inferVersion(payload);
  const type = sanitizeText(payload?.type || 'diagnostic').slice(0, 40);
  const summary = sanitizeText(payload?.summary || payload?.message || payload?.report?.summary || '诊断报告').slice(0, 120);
  const id = `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const body = [
    `# 灵澈反馈 ${id}`,
    '',
    `- 类型：${type}`,
    `- 等级：${level}`,
    `- App 版本：${version}`,
    `- 接收时间：${new Date().toISOString()}`,
    `- 来源 IP：${ip}`,
    `- User-Agent：${sanitizeText(request.headers.get('user-agent') || 'unknown')}`,
    '',
    '## 摘要',
    summary,
    '',
    '## 脱敏后的原始报告',
    '```json',
    safeJson(payload, 55000),
    '```',
  ].join('\n');

  const labels = [githubConfig.feedbackLabel, type, level, version && `v${version}`].filter(Boolean);

  if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
    return NextResponse.json({
      ok: false,
      id,
      error: '反馈站未配置 GitHub Issues 保存目标。请配置 GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO。',
    }, { status: 500 });
  }

  try {
    const issue = await createFeedbackIssue({
      title: `[${version}][${level}] ${summary}`.slice(0, 250),
      body,
      labels,
    });
    return NextResponse.json({
      ok: true,
      id,
      message: '反馈已接收',
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, id, error: String(error?.message || error) }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
