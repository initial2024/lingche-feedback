import { siteConfig } from '@/lib/config';
import { getLatestPayload } from '@/lib/latest';

export default function HomePage() {
  const latest = getLatestPayload();
  return (
    <>
      <section className="hero">
        <h1>{siteConfig.siteName}</h1>
        <p>用于接收灵澈 App 诊断报告、发布最新版本信息、提供下载入口。站点不会自动收集数据，只有用户主动提交才会保存反馈。</p>
        <div className="navlinks">
          <a href="/releases">查看最新版</a>
          <a href="/feedback">手动提交反馈</a>
          <a href="/api/latest">API: latest</a>
        </div>
      </section>
      <section className="grid">
        <div className="card"><h2>最新版</h2><p>{latest.title}</p><p className="ok">versionCode：{latest.versionCode}</p></div>
        <div className="card"><h2>App 接口</h2><p><code>/api/latest</code> 检查更新；<code>/api/feedback/report</code> 接收诊断报告。</p></div>
        <div className="card"><h2>下载镜像</h2><p>{latest.chinaMirrorUrl || '暂未配置大陆备用下载地址'}</p></div>
      </section>
    </>
  );
}
