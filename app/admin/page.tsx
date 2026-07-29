'use client';

import { useEffect, useRef, useState } from 'react';
import { analyzeAdminToken, normalizeAdminToken, type AdminTokenShape } from '@/lib/admin-token';

const ADMIN_TOKEN_STORAGE = 'LINGCHE_ADMIN_TOKEN';

type Issue = {
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  labels: string[];
};

type Result = {
  kind: 'success' | 'error' | 'info';
  text: string;
} | null;

type AdminStatus = {
  adminTokenConfigured: boolean;
  adminTokenShape?: AdminTokenShape;
};

type HeaderEcho = {
  receivedHeaderPresent: boolean;
  received: AdminTokenShape;
};

type AuthorizationDiagnostic = {
  serverTokenConfigured: boolean;
  headerPresent: boolean;
  server: AdminTokenShape;
  received: AdminTokenShape;
  normalizedLengthEqual: boolean;
  normalizedMatch: boolean;
};

type SubmissionDiagnostic = {
  dom: AdminTokenShape;
  state: AdminTokenShape;
  cached: AdminTokenShape;
  sent: AdminTokenShape;
  domMatchesState: boolean;
  domMatchesCached: boolean;
  headerSent: boolean;
  echo?: HeaderEcho;
  echoError?: string;
};

function getDiagnosticAdvice(diagnostic: AuthorizationDiagnostic): string[] {
  const advice: string[] = [];

  if (!diagnostic.normalizedLengthEqual) {
    advice.push('服务端 token 长度与实际收到的 token 长度不同。请检查 Vercel Value 是否多填、少填、带引号或复制错误。');
  }
  if (diagnostic.server.hadWrappingQuotes) {
    advice.push('Vercel ADMIN_TOKEN 可能被引号包裹，请删除引号后重新部署。');
  }
  if (diagnostic.server.hadAdminTokenPrefix) {
    advice.push('Vercel Value 中包含 ADMIN_TOKEN= 前缀。当前代码会兼容，但建议只保留 token 本体。');
  }
  if (diagnostic.normalizedLengthEqual && !diagnostic.normalizedMatch) {
    advice.push('长度相同但内容不一致。请删除 Vercel ADMIN_TOKEN 后重新新建一个简单 ASCII token，并重新 Redeploy。');
  }

  return advice;
}

function buildDiagnosticText(submission: SubmissionDiagnostic, diagnostic: AuthorizationDiagnostic | null): string {
  const lines = [
    '授权诊断（不包含 Token 内容）',
    `DOM normalizedLength：${submission.dom.normalizedLength}`,
    `React state normalizedLength：${submission.state.normalizedLength}`,
    `localStorage normalizedLength：${submission.cached.normalizedLength}`,
    `本次发送 normalizedLength：${submission.sent.normalizedLength}`,
    `DOM 与 state 一致：${submission.domMatchesState}`,
    `DOM 与 localStorage 一致：${submission.domMatchesCached}`,
    `已发送 X-Admin-Token：${submission.headerSent}`,
    `echo received normalizedLength：${submission.echo?.received.normalizedLength ?? '未返回'}`,
    `echo received header：${submission.echo?.receivedHeaderPresent ?? false}`,
    `DOM 零宽字符：${submission.dom.hasZeroWidthChars}`,
    `发送值零宽字符：${submission.sent.hasZeroWidthChars}`,
  ];

  if (diagnostic) {
    lines.push(
      `服务端 expected normalizedLength：${diagnostic.server.normalizedLength}`,
      `Issues 实际收到 normalizedLength：${diagnostic.received.normalizedLength}`,
      `Issues 实际收到 header：${diagnostic.headerPresent}`,
      `normalizedLengthEqual：${diagnostic.normalizedLengthEqual}`,
      `normalizedMatch：${diagnostic.normalizedMatch}`,
    );
  }

  return lines.join('\n');
}

export default function AdminPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [token, setToken] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [submission, setSubmission] = useState<SubmissionDiagnostic | null>(null);
  const [diagnostic, setDiagnostic] = useState<AuthorizationDiagnostic | null>(null);

  useEffect(() => {
    const cached = normalizeAdminToken(localStorage.getItem(ADMIN_TOKEN_STORAGE) || '');
    if (cached) localStorage.setItem(ADMIN_TOKEN_STORAGE, cached);
    setToken(cached);
    void loadAdminStatus();
  }, []);

  async function loadAdminStatus() {
    try {
      const response = await fetch('/api/admin/status', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.ok) {
        setAdminStatus({
          adminTokenConfigured: Boolean(data.adminTokenConfigured),
          adminTokenShape: data.adminTokenShape,
        });
      }
    } catch {
      // Status is advisory only; authenticated issue reads remain the source of truth.
    }
  }

  async function load() {
    if (loading) return;

    const domValue = inputRef.current?.value ?? '';
    const stateValue = token;
    const cachedValue = localStorage.getItem(ADMIN_TOKEN_STORAGE) || '';
    const normalizedToken = normalizeAdminToken(domValue);
    const dom = analyzeAdminToken(domValue);
    const state = analyzeAdminToken(stateValue);
    const cached = analyzeAdminToken(cachedValue);
    const sent = analyzeAdminToken(normalizedToken);
    const submissionBase: SubmissionDiagnostic = {
      dom,
      state,
      cached,
      sent,
      domMatchesState: domValue === stateValue,
      domMatchesCached: normalizeAdminToken(domValue) === normalizeAdminToken(cachedValue),
      headerSent: false,
    };

    setToken(domValue);
    setDiagnostic(null);
    setSubmission(submissionBase);

    if (!normalizedToken) {
      setResult({ kind: 'error', text: '请输入管理员 Token。DOM 输入为空时不会使用 React state 或本地缓存提交。' });
      return;
    }

    if (!submissionBase.domMatchesState || !submissionBase.domMatchesCached) {
      setResult({ kind: 'info', text: '输入框当前值与 React state 或本地缓存不一致，本次使用输入框当前值。' });
    } else {
      setResult({ kind: 'info', text: '正在验证请求头并读取反馈列表…' });
    }

    setLoading(true);
    const withHeader: SubmissionDiagnostic = { ...submissionBase, headerSent: true };
    setSubmission(withHeader);

    try {
      let echo: HeaderEcho | undefined;
      let echoError: string | undefined;

      try {
        const echoResponse = await fetch('/api/admin/token-echo', {
          headers: { 'X-Admin-Token': normalizedToken },
          cache: 'no-store',
        });
        const echoData = await echoResponse.json();
        if (!echoResponse.ok || !echoData.ok) {
          throw new Error(echoData.error || '请求头 echo 失败');
        }
        echo = {
          receivedHeaderPresent: Boolean(echoData.receivedHeaderPresent),
          received: echoData.received as AdminTokenShape,
        };
      } catch (error: any) {
        echoError = String(error?.message || error);
      }

      setSubmission({ ...withHeader, echo, echoError });

      const response = await fetch('/api/admin/issues?state=open&perPage=30', {
        headers: { 'X-Admin-Token': normalizedToken },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (data.diagnostic) setDiagnostic(data.diagnostic as AuthorizationDiagnostic);
        const prefix = data.error_code ? `[${data.error_code}] ` : '';
        throw new Error(`${prefix}${data.error || '读取失败'}`);
      }

      localStorage.setItem(ADMIN_TOKEN_STORAGE, normalizedToken);
      setToken(normalizedToken);
      if (inputRef.current) inputRef.current.value = normalizedToken;
      setIssues(data.issues || []);
      await loadAdminStatus();
      setResult({ kind: 'success', text: `已读取 ${data.issues?.length || 0} 条反馈。` });
    } catch (error: any) {
      setResult({ kind: 'error', text: String(error?.message || error) });
    } finally {
      setLoading(false);
    }
  }

  function clearLocalToken() {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE);
    setToken('');
    if (inputRef.current) inputRef.current.value = '';
    setIssues([]);
    setSubmission(null);
    setDiagnostic(null);
    setResult({ kind: 'success', text: '已清除本地 Token。请重新粘贴当前 Vercel Production 的 ADMIN_TOKEN。' });
  }

  async function copyDiagnostic() {
    if (!submission) return;

    try {
      await navigator.clipboard.writeText(buildDiagnosticText(submission, diagnostic));
      setResult({ kind: 'success', text: '已复制不含 Token 内容的授权诊断。' });
    } catch {
      setResult({ kind: 'error', text: '复制授权诊断失败，请检查浏览器剪贴板权限。' });
    }
  }

  return (
    <section className="card admin-card">
      <div className="eyebrow">GITHUB ISSUES</div>
      <h1>反馈管理</h1>
      <p>输入 Vercel 环境变量 <code>ADMIN_TOKEN</code> 后读取 GitHub Issues 中的反馈。Token 只保存在当前浏览器，不会显示在诊断、页面其他区域或 URL 中。</p>
      <label htmlFor="admin-token">管理员 Token</label>
      <div className="token-input-row">
        <input
          ref={inputRef}
          id="admin-token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          type={showToken ? 'text' : 'password'}
          placeholder="粘贴 ADMIN_TOKEN 或 ADMIN_TOKEN=..."
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button type="button" className="secondary" onClick={() => setShowToken((value) => !value)}>{showToken ? '隐藏' : '显示'}</button>
      </div>
      <div className="form-actions">
        <button type="button" onClick={load} disabled={loading}>{loading ? '正在读取…' : '读取反馈列表'}</button>
        <button type="button" className="secondary" onClick={clearLocalToken}>清除本地 Token</button>
        {submission && <button type="button" className="secondary" onClick={copyDiagnostic}>复制授权诊断</button>}
      </div>
      {result && <div className={`result-${result.kind}`}>{result.text}</div>}
      {submission && (
        <div className="local-input-diagnostic" aria-live="polite">
          <strong>本次实际提交诊断（不包含 Token 内容）</strong>
          <span>DOM rawLength：{submission.dom.rawLength}</span>
          <span>DOM normalizedLength：{submission.dom.normalizedLength}</span>
          <span>React state normalizedLength：{submission.state.normalizedLength}</span>
          <span>localStorage normalizedLength：{submission.cached.normalizedLength}</span>
          <span>本次将发送 normalizedLength：{submission.sent.normalizedLength}</span>
          <span>DOM 与 state 一致：{String(submission.domMatchesState)}</span>
          <span>DOM 与 localStorage 一致：{String(submission.domMatchesCached)}</span>
          <span>DOM 有 ADMIN_TOKEN= 前缀：{String(submission.dom.hadAdminTokenPrefix)}</span>
          <span>DOM 有首尾空格：{String(submission.dom.hadLeadingOrTrailingWhitespace)}</span>
          <span>DOM 有引号：{String(submission.dom.hadWrappingQuotes)}</span>
          <span>DOM 有零宽字符：{String(submission.dom.hasZeroWidthChars)}</span>
          <span>已发送 X-Admin-Token：{String(submission.headerSent)}</span>
          <span>Echo 实际收到 normalizedLength：{submission.echo?.received.normalizedLength ?? '未返回'}</span>
          <span>Echo 实际收到 header：{String(submission.echo?.receivedHeaderPresent ?? false)}</span>
          {submission.echoError && <span>Echo 错误：{submission.echoError}</span>}
        </div>
      )}
      <div className="admin-status" aria-live="polite">
        <strong>服务端 ADMIN_TOKEN：</strong>{adminStatus?.adminTokenConfigured ? '已配置' : '未配置或状态读取中'}
        {adminStatus?.adminTokenShape && <span>服务端 token normalized 长度：{adminStatus.adminTokenShape.normalizedLength}</span>}
      </div>
      {diagnostic && (
        <section className="diagnostic-card" aria-live="polite">
          <div className="diagnostic-heading">
            <div>
              <div className="eyebrow">AUTHORIZATION DIAGNOSTIC</div>
              <h2>Issues 鉴权诊断</h2>
            </div>
          </div>
          <div className="diagnostic-grid">
            <span>服务端 ADMIN_TOKEN 已配置</span><strong>{String(diagnostic.serverTokenConfigured)}</strong>
            <span>Issues 实际收到 X-Admin-Token</span><strong>{String(diagnostic.headerPresent)}</strong>
            <span>服务端 expected normalizedLength</span><strong>{diagnostic.server.normalizedLength}</strong>
            <span>Issues 实际收到 normalizedLength</span><strong>{diagnostic.received.normalizedLength}</strong>
            <span>长度是否相同</span><strong>{String(diagnostic.normalizedLengthEqual)}</strong>
            <span>服务端带 ADMIN_TOKEN= 前缀</span><strong>{String(diagnostic.server.hadAdminTokenPrefix)}</strong>
            <span>实际收到带 ADMIN_TOKEN= 前缀</span><strong>{String(diagnostic.received.hadAdminTokenPrefix)}</strong>
            <span>服务端带引号</span><strong>{String(diagnostic.server.hadWrappingQuotes)}</strong>
            <span>实际收到带引号</span><strong>{String(diagnostic.received.hadWrappingQuotes)}</strong>
            <span>服务端带换行</span><strong>{String(diagnostic.server.hadNewline)}</strong>
            <span>实际收到带换行</span><strong>{String(diagnostic.received.hadNewline)}</strong>
            <span>服务端有零宽字符</span><strong>{String(diagnostic.server.hasZeroWidthChars)}</strong>
            <span>实际收到有零宽字符</span><strong>{String(diagnostic.received.hasZeroWidthChars)}</strong>
            <span>normalizedMatch</span><strong>{String(diagnostic.normalizedMatch)}</strong>
          </div>
          {getDiagnosticAdvice(diagnostic).length > 0 && (
            <ul className="diagnostic-advice">
              {getDiagnosticAdvice(diagnostic).map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      )}
      <div className="admin-help">
        <strong>如果一直未授权，请检查：</strong>
        <ol>
          <li>Vercel → lingche-feedback-gnkt → Settings → Environment Variables。</li>
          <li><code>ADMIN_TOKEN</code> 是否配置在 Production，而非仅 Preview。</li>
          <li>修改环境变量后是否重新 Redeploy。</li>
          <li>输入框是否误粘贴了 <code>ADMIN_TOKEN=</code> 前缀，或仍缓存旧 Token。</li>
        </ol>
      </div>
      {issues.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>#</th><th>标题</th><th>标签</th><th>时间</th></tr></thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.number}>
                  <td>{issue.number}</td>
                  <td><a href={issue.url} target="_blank" rel="noreferrer">{issue.title}</a></td>
                  <td>{issue.labels.map((label) => <span className="badge" key={label}>{label}</span>)}</td>
                  <td><span className="muted">{issue.createdAt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
