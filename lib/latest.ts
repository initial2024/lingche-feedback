import { env, envBool, envInt, siteConfig } from './config';

export function getLatestPayload() {
  return {
    ok: true,
    service: 'lingche-feedback-site',
    site: siteConfig.siteName,
    version: env('LATEST_VERSION', '4.8.7'),
    versionCode: envInt('LATEST_VERSION_CODE', 119),
    title: env('LATEST_TITLE', 'v48.7 final-r3 / V13 高德 Key Bridge 修复测试版'),
    apkUrl: env('LATEST_APK_URL'),
    chinaMirrorUrl: env('LATEST_CHINA_MIRROR_URL'),
    sourceUrl: env('LATEST_SOURCE_URL'),
    sha256: env('LATEST_SHA256', 'A61C06C0DFA12732053C342C431B4DD5CDAE8A3B124B532F33252A3743704297'),
    required: envBool('LATEST_REQUIRED', false),
    changelog: env('LATEST_CHANGELOG', 'v48.7 final-r3：\n- 新增 IP 情报面板与在线/离线地图能力。\n- 新增高德 Android 原生地图配置入口。\n- 修复 IP 粗定位、IP 增强、城市文本估算点显示。\n- 修复当前时间类问题由 App 直接回答。\n- 优化 IP 纯净度、WebRTC、IPv4/IPv6 分层诊断。\n- 高德 Key Bridge 仍在真机验证中。'),
    updatedAt: env('LATEST_UPDATED_AT', '2026-07-29T00:00:00+08:00'),
  };
}
