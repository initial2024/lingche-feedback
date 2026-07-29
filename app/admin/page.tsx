'use client';

import { useEffect, useState } from 'react';

type Issue = {
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  labels: string[];
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [result, setResult] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('LINGCHE_ADMIN_TOKEN') || '');
  }, []);

  async function load() {
    localStorage.setItem('LINGCHE_ADMIN_TOKEN', token);
    setResult('正在读取...');
    try {
      const res = await fetch('/api/admin/issues?state=open&perPage=30', {
        headers: { 'X-Admin-Token': token },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || '读取失败');
      setIssues(data.issues || []);
      setResult(`已读取 ${data.issues?.length || 0} 条。`);
    } catch (error: any) {
      setResult(String(error?.message || error));
    }
  }

  return (
    <section className="card admin-card"><div className="eyebrow">GITHUB ISSUES</div><h1>反馈管理</h1><p>输入 Vercel 环境变量 <code>ADMIN_TOKEN</code> 后读取 GitHub Issues 中的反馈。Token 只在本机浏览器使用，不会展示在页面上。</p><label htmlFor="admin-token">管理员 Token</label><input id="admin-token" value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="ADMIN_TOKEN" /><div className="form-actions"><button onClick={load}>读取反馈列表</button><span className="muted">处理、关闭、打标签请在 GitHub Issues 完成。</span></div>{result && <div className={result.startsWith('已读取') ? 'result-success' : 'result-error'}>{result}</div>}{issues.length > 0 && <div className="table-wrap"><table className="table">
          <thead><tr><th>#</th><th>标题</th><th>标签</th><th>时间</th></tr></thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.number}>
                <td>{issue.number}</td>
                <td><a href={issue.url} target="_blank">{issue.title}</a></td>
                <td>{issue.labels.map((l) => <span className="badge" key={l}>{l}</span>)}</td>
                <td><span className="muted">{issue.createdAt}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>}
    </section>
  );
}
