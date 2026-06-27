import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: siteConfig.siteName,
  description: '灵澈 App 自建反馈站、版本发布与诊断报告接收中心',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="shell">
          <nav className="nav">
            <div className="brand">灵澈反馈站</div>
            <div className="navlinks">
              <a href="/">首页</a>
              <a href="/releases">版本</a>
              <a href="/feedback">反馈</a>
              <a href="/admin">管理</a>
              <a href="/api/health">Health</a>
            </div>
          </nav>
          {children}
          <div className="footer">默认不收集任何内容；只有 App 或用户主动提交后，反馈才会发送到此站点。</div>
        </main>
      </body>
    </html>
  );
}
