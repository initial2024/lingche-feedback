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
    <section className="card">
      <h1>反馈管理</h1>
      <p>输入 Vercel 环境变量 <code>ADMIN_TOKEN</code> 后可读取 GitHub Issues 中的反馈。处理、关闭、打标签建议直接在 GitHub Issues 页面完成。</p>
      <label>管理员 Token</label>
      <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="ADMIN_TOKEN" />
      <p><button onClick={load}>读取反馈列表</button></p>
      {result && <pre>{result}</pre>}
      {issues.length > 0 && (
        <table className="table">
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
        </table>
      )}
    </section>
  );
}
