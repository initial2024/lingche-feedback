'use client';

import { useState } from 'react';

export default function FeedbackPage() {
  const [type, setType] = useState('bug');
  const [severity, setSeverity] = useState('medium');
  const [appVersion, setAppVersion] = useState('');
  const [message, setMessage] = useState('');
  const [steps, setSteps] = useState('');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setResult({ kind: 'info', text: '正在提交，请稍候…' });
    try {
      const res = await fetch('/api/feedback/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          severity,
          appVersion: appVersion || 'manual',
          generatedAt: new Date().toISOString(),
          summary: message.slice(0, 120) || '手动反馈',
          contact,
          report: { message, steps, contact, type, severity },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || '提交失败');
      setResult({ kind: 'success', text: `反馈已接收 · ID ${data.id}${data.issueNumber ? ` · Issue #${data.issueNumber}` : ''}` });
      setMessage('');
      setSteps('');
    } catch (error: any) {
      setResult({ kind: 'error', text: String(error?.message || error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card form-card"><div className="eyebrow">DIAGNOSTIC FEEDBACK</div><h1>提交反馈</h1><p>描述越具体，越方便定位问题。App 内诊断报告也会提交到同一个反馈接口。</p><form onSubmit={submit}><div className="form-grid"><div><label htmlFor="feedback-type">问题类型</label><select id="feedback-type" value={type} onChange={(e) => setType(e.target.value)}><option value="bug">Bug</option><option value="地图 / IP 诊断">地图 / IP 诊断</option><option value="登录 / 账号">登录 / 账号</option><option value="下载 / 更新">下载 / 更新</option><option value="性能 / 卡顿">性能 / 卡顿</option><option value="其他">其他</option></select></div><div><label htmlFor="feedback-severity">严重程度</label><select id="feedback-severity" value={severity} onChange={(e) => setSeverity(e.target.value)}><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="critical">紧急</option></select></div></div><label htmlFor="app-version">App 版本，可选</label><input id="app-version" value={appVersion} onChange={(e) => setAppVersion(e.target.value)} placeholder="例如 v48.7 final-r3" /><label htmlFor="feedback-message">问题描述</label><textarea id="feedback-message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="发生了什么？你期望看到什么？" /><label htmlFor="feedback-steps">复现步骤，可选</label><textarea id="feedback-steps" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="1. 进入某页面\n2. 点击某按钮\n3. 观察到问题" /><label htmlFor="feedback-contact">联系方式，可选</label><input id="feedback-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="邮箱 / GitHub / QQ，可不填" /><div className="form-actions"><button type="submit" disabled={submitting}>{submitting ? '正在提交…' : '提交反馈'}</button><span className="muted">请勿提交密钥或完整敏感坐标。</span></div></form>{result && <div className={`result-${result.kind}`}>{result.text}</div>}</section>
  );
}
