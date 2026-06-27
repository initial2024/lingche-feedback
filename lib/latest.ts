import { env, envBool, envInt, siteConfig } from './config';

export function getLatestPayload() {
  return {
    ok: true,
    service: 'lingche-feedback-site',
    site: siteConfig.siteName,
    version: env('LATEST_VERSION', '4.8.7'),
    versionCode: envInt('LATEST_VERSION_CODE', 117),
    title: env('LATEST_TITLE', 'v48.7 final-r2 诊断中心与自建反馈站版'),
    apkUrl: env('LATEST_APK_URL'),
    chinaMirrorUrl: env('LATEST_CHINA_MIRROR_URL', siteConfig.downloadPageUrl),
    sourceUrl: env('LATEST_SOURCE_URL'),
    sha256: env('LATEST_SHA256'),
    required: envBool('LATEST_REQUIRED', false),
    changelog: env('LATEST_CHANGELOG', 'v48.7 final-r2：诊断中心与自建反馈站。'),
    updatedAt: env('LATEST_UPDATED_AT', new Date().toISOString()),
  };
}
