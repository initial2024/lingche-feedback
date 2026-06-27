import { getLatestPayload } from '@/lib/latest';

export default function ReleasesPage() {
  const latest = getLatestPayload();
  return (
    <section className="card">
      <h1>最新版本</h1>
      <div className="kv"><div className="muted">版本</div><div>{latest.version}</div></div>
      <div className="kv"><div className="muted">versionCode</div><div>{latest.versionCode}</div></div>
      <div className="kv"><div className="muted">标题</div><div>{latest.title}</div></div>
      <div className="kv"><div className="muted">强制更新</div><div>{latest.required ? '是' : '否'}</div></div>
      <div className="kv"><div className="muted">APK</div><div>{latest.apkUrl ? <a href={latest.apkUrl}>海外下载</a> : '暂未配置'}</div></div>
      <div className="kv"><div className="muted">大陆镜像</div><div>{latest.chinaMirrorUrl ? <a href={latest.chinaMirrorUrl}>备用下载</a> : '暂未配置'}</div></div>
      <div className="kv"><div className="muted">源码包</div><div>{latest.sourceUrl ? <a href={latest.sourceUrl}>下载源码包</a> : '暂未配置'}</div></div>
      <div className="kv"><div className="muted">SHA256</div><div>{latest.sha256 || '可选'}</div></div>
      <h2>更新说明</h2>
      <pre>{latest.changelog}</pre>
    </section>
  );
}
