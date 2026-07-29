'use client';

import { useEffect, useState } from 'react';

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

function normalizeAdminToken(input: string): string {
  return input
    .trim()
    .replace(/^ADMIN_TOKEN\s*=\s*/i, '')
    .trim();
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = normalizeAdminToken(localStorage.getItem(ADMIN_TOKEN_STORAGE) || '');
    if (cached) localStorage.setItem(ADMIN_TOKEN_STORAGE, cached);
    setToken(cached);
  }, []);

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
    setResult({ kind: 'info', text: '正在读取反馈列表…' });

    try {
      const res = await fetch('/api/admin/issues?state=open&perPage=30', {
        headers: { 'X-Admin-Token': normalizedToken },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const prefix = data.error_code ? `[${data.error_code}] ` : '';
        throw new Error(`${prefix}${data.error || '读取失败'}`);
      }
      setIssues(data.issues || []);
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
    setResult({ kind: 'success', text: '已清除本地保存的 Token。' });
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
