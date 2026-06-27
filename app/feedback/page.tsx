'use client';

import { useState } from 'react';

export default function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState('');

  async function submit() {
    setResult('正在提交...');
    try {
      const res = await fetch('/api/feedback/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual-feedback',
          appVersion: 'manual',
          generatedAt: new Date().toISOString(),
          summary: message.slice(0, 120) || '手动反馈',
          contact,
          report: { message, contact },
        }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(String(error?.message || error));
    }
  }

  return (
    <section className="card">
      <h1>手动提交反馈</h1>
      <p>这里适合用户手动描述问题。App 内诊断报告会直接提交到同一个接口。</p>
      <label>问题描述</label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="请描述问题、复现步骤、截图说明等" />
      <label>联系方式，可选</label>
      <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="邮箱 / GitHub / QQ，可不填" />
      <p><button onClick={submit}>提交反馈</button></p>
      {result && <pre>{result}</pre>}
    </section>
  );
}
