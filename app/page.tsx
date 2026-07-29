import { siteConfig } from '@/lib/config';
import { getLatestPayload } from '@/lib/latest';

export default function HomePage() {
  const latest = getLatestPayload();
  const updatedAt = new Date(latest.updatedAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <>
      <section className="hero hero-large">
        <div className="eyebrow">LINGCHE / RELEASE & DIAGNOSTICS</div>
        <h1>{siteConfig.siteName}</h1>
        <p className="hero-lead">发布、诊断、反馈与版本检查中心</p>
        <p>用于接收灵澈 App 诊断报告、发布最新版本信息、提供下载入口。站点不会自动收集数据，只有用户主动提交才会保存反馈。</p>
        <div className="action-row">
          <a className="button primary" href="/releases">查看最新版</a>
          <a className="button" href="/feedback">提交反馈</a>
          <a className="button secondary" href="/api/health">查看 API 状态</a>
        </div>
      </section>
      <section className="section-heading"><div><div className="eyebrow">CURRENT RELEASE</div><h2>当前版本</h2></div><a className="text-link" href="/releases">查看发布详情 →</a></section>
      <section className="release-card release-summary">
        <div className="release-main"><span className="status-pill ok">可检查更新</span><h2>{latest.title}</h2><p className="release-version">v{latest.version} <span>·</span> versionCode {latest.versionCode}</p></div>
        <div className="release-meta"><div><span className="muted">更新时间</span><strong>{updatedAt}</strong></div><div><span className="muted">强制更新</span><strong>{latest.required ? '是' : '否'}</strong></div></div>
      </section>
      <section className="grid grid-three">
        <a className="feature-card" href="/releases"><span className="feature-index">01</span><h3>版本发布</h3><p>查看最新版本、更新说明与校验信息。</p><span className="text-link">进入版本页 →</span></a>
        <a className="feature-card" href="/feedback"><span className="feature-index">02</span><h3>诊断反馈</h3><p>提交问题描述、复现步骤与联系方式。</p><span className="text-link">提交一条反馈 →</span></a>
        <a className="feature-card" href="/admin"><span className="feature-index">03</span><h3>反馈管理</h3><p>管理员读取 GitHub Issues 中的反馈记录。</p><span className="text-link">打开管理页 →</span></a>
      </section>
      <section className="grid grid-two">
        <div className="endpoint-card"><div className="eyebrow">APP ENDPOINTS</div><h2>接口状态</h2><div className="endpoint-row"><code>/api/latest</code><span>App 检查更新</span></div><div className="endpoint-row"><code>/api/feedback/report</code><span>App 诊断报告提交</span></div><div className="endpoint-row"><code>/api/health</code><span>站点健康检查</span></div></div>
        <div className="notice-card"><div className="eyebrow">PRIVACY</div><h2>隐私说明</h2><p>默认不收集任何内容。只有 App 或用户主动提交反馈时，才会发送报告。</p><p>诊断报告应默认脱敏，请不要提交密钥、完整定位坐标或其他敏感信息。</p></div>
      </section>
      <section className="download-strip"><div><span className="eyebrow">DOWNLOAD</span><h2>获取当前版本</h2><p>{latest.apkUrl ? '正式 APK 下载地址已配置。' : '正式 APK 下载地址待配置；局域网 APK 仅用于本地测试。'}</p></div><a className="button primary" href="/releases">查看下载状态</a>
      </section>
    </>
  );
}
