'use client';

import { useEffect, useState } from 'react';
import { normalizeAdminToken, type AdminTokenShape } from '@/lib/admin-token';

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

type AuthorizationDiagnostic = {
  serverTokenConfigured: boolean;
  server: AdminTokenShape;
  received: AdminTokenShape;
  normalizedLengthEqual: boolean;
  normalizedMatch: boolean;
};

function getDiagnosticAdvice(diagnostic: AuthorizationDiagnostic): string[] {
  const advice: string[] = [];

  if (!diagnostic.normalizedLengthEqual) {
    advice.push('服务端 token 长度与输入 token 长度不同。请检查 Vercel Value 是否多填、少填、带引号或复制错误。');
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

function buildDiagnosticText(diagnostic: AuthorizationDiagnostic): string {
  const lines = [
    '授权诊断（不包含 Token 内容）',
    `服务端 ADMIN_TOKEN 已配置：${diagnostic.serverTokenConfigured}`,
    `服务端 normalized 长度：${diagnostic.server.normalizedLength}`,
    `输入 normalized 长度：${diagnostic.received.normalizedLength}`,
    `长度是否相同：${diagnostic.normalizedLengthEqual}`,
    `服务端带 ADMIN_TOKEN= 前缀：${diagnostic.server.hadAdminTokenPrefix}`,
    `输入带 ADMIN_TOKEN= 前缀：${diagnostic.received.hadAdminTokenPrefix}`,
    `服务端带引号：${diagnostic.server.hadWrappingQuotes}`,
    `输入带引号：${diagnostic.received.hadWrappingQuotes}`,
    `服务端带换行：${diagnostic.server.hadNewline}`,
    `输入带换行：${diagnostic.received.hadNewline}`,
    `normalizedMatch：${diagnostic.normalizedMatch}`,
  ];

  return lines.join('\n');
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
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

    const normalizedToken = normalizeAdminToken(token);
    if (!normalizedToken) {
      setResult({ kind: 'error', text: '请输入管理员 Token。' });
      return;
    }

    setToken(normalizedToken);
    localStorage.setItem(ADMIN_TOKEN_STORAGE, normalizedToken);
    setLoading(true);
    setDiagnostic(null);
    setResult({ kind: 'info', text: '正在读取反馈列表…' });

    try {
      const res = await fetch('/api/admin/issues?state=open&perPage=30', {
        headers: { 'X-Admin-Token': normalizedToken },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.diagnostic) setDiagnostic(data.diagnostic as AuthorizationDiagnostic);
        const prefix = data.error_code ? `[${data.error_code}] ` : '';
        throw new Error(`${prefix}${data.error || '读取失败'}`);
      }
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
    setIssues([]);
    setDiagnostic(null);
    setResult({ kind: 'success', text: '已清除本地保存的 Token。' });
  }

  async function copyDiagnostic() {
    if (!diagnostic) return;

    try {
      await navigator.clipboard.writeText(buildDiagnosticText(diagnostic));
      setResult({ kind: 'success', text: '已复制不含 Token 内容的授权诊断。' });
    } catch {
      setResult({ kind: 'error', text: '复制授权诊断失败，请检查浏览器剪贴板权限。' });
    }
  }

  return (
    <section className="card admin-card">
      <div className="eyebrow">GITHUB ISSUES</div>
      <h1>反馈管理</h1>
      <p>输入 Vercel 环境变量 <code>ADMIN_TOKEN</code> 后读取 GitHub Issues 中的反馈。Token 只保存在当前浏览器，不会显示在页面或 URL 中。</p>
      <label htmlFor="admin-token">管理员 Token</label>
      <input
        id="admin-token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        type="password"
        placeholder="粘贴 ADMIN_TOKEN 或 ADMIN_TOKEN=..."
        autoComplete="off"
      />
      <div className="form-actions">
        <button type="button" onClick={load} disabled={loading}>{loading ? '正在读取…' : '读取反馈列表'}</button>
        <button type="button" className="secondary" onClick={clearLocalToken}>清除本地 Token</button>
      </div>
      {result && <div className={`result-${result.kind}`}>{result.text}</div>}
      <div className="admin-status" aria-live="polite">
        <strong>服务端 ADMIN_TOKEN：</strong>{adminStatus?.adminTokenConfigured ? '已配置' : '未配置或状态读取中'}
        {adminStatus?.adminTokenShape && <span>服务端 token normalized 长度：{adminStatus.adminTokenShape.normalizedLength}</span>}
      </div>
      {diagnostic && (
        <section className="diagnostic-card" aria-live="polite">
          <div className="diagnostic-heading">
            <div>
              <div className="eyebrow">AUTHORIZATION DIAGNOSTIC</div>
              <h2>授权诊断</h2>
            </div>
            <button type="button" className="secondary" onClick={copyDiagnostic}>复制授权诊断</button>
          </div>
          <div className="diagnostic-grid">
            <span>服务端 ADMIN_TOKEN 已配置</span><strong>{String(diagnostic.serverTokenConfigured)}</strong>
            <span>服务端 normalized 长度</span><strong>{diagnostic.server.normalizedLength}</strong>
            <span>输入 normalized 长度</span><strong>{diagnostic.received.normalizedLength}</strong>
            <span>长度是否相同</span><strong>{String(diagnostic.normalizedLengthEqual)}</strong>
            <span>服务端带 ADMIN_TOKEN= 前缀</span><strong>{String(diagnostic.server.hadAdminTokenPrefix)}</strong>
            <span>输入带 ADMIN_TOKEN= 前缀</span><strong>{String(diagnostic.received.hadAdminTokenPrefix)}</strong>
            <span>服务端带引号</span><strong>{String(diagnostic.server.hadWrappingQuotes)}</strong>
            <span>输入带引号</span><strong>{String(diagnostic.received.hadWrappingQuotes)}</strong>
            <span>服务端带换行</span><strong>{String(diagnostic.server.hadNewline)}</strong>
            <span>输入带换行</span><strong>{String(diagnostic.received.hadNewline)}</strong>
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
