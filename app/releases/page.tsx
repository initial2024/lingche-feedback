import { getLatestPayload } from '@/lib/latest';

export default function ReleasesPage() {
  const latest = getLatestPayload();
  const updatedAt = new Date(latest.updatedAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
  const changelog = latest.changelog.split('\n').filter(Boolean);
  return (
    <>
      <section className="release-hero"><div className="eyebrow">LATEST RELEASE</div><span className="status-pill ok">当前最新版</span><h1>v{latest.version}</h1><p>{latest.title}</p><div className="release-version">versionCode {latest.versionCode} <span>·</span> 更新于 {updatedAt}</div></section>
      <section className="grid grid-two release-layout">
        <div className="card"><div className="eyebrow">DOWNLOADS</div><h2>下载与校验</h2><div className="kv"><div className="muted">主下载</div><div>{latest.apkUrl ? <a className="text-link" href={latest.apkUrl}>打开 APK 下载 →</a> : <span className="warn">正式 APK 下载地址待配置</span>}</div></div><div className="kv"><div className="muted">大陆镜像</div><div>{latest.chinaMirrorUrl ? <a className="text-link" href={latest.chinaMirrorUrl}>打开备用下载 →</a> : <span className="muted">暂未配置</span>}</div></div><div className="kv"><div className="muted">源码包</div><div>{latest.sourceUrl ? <a className="text-link" href={latest.sourceUrl}>下载源码包 →</a> : <span className="muted">暂未配置</span>}</div></div><div className="kv"><div className="muted">SHA256</div><div className="hash">{latest.sha256 || '未配置'}</div></div>{!latest.apkUrl && <p className="notice-inline">局域网 APK 仅用于本地测试，不写入正式站点。</p>}</div>
        <div className="card"><div className="eyebrow">RELEASE STATUS</div><h2>版本状态</h2><div className="kv"><div className="muted">强制更新</div><div><span className={`status-pill ${latest.required ? 'warn' : 'ok'}`}>{latest.required ? '是' : '否'}</span></div></div><div className="kv"><div className="muted">App 接口</div><div><a className="text-link" href="/api/latest">GET /api/latest →</a></div></div><div className="kv"><div className="muted">数据来源</div><div>反馈站最新版配置</div></div></div>
      </section>
      <section className="card changelog-card"><div className="eyebrow">CHANGELOG</div><h2>更新说明</h2><ul className="changelog">{changelog.map((line, index) => <li key={`${line}-${index}`}>{line.replace(/^-\s*/, '')}</li>)}</ul></section>
    </>
  );
}
