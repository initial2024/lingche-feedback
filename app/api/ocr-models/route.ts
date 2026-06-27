import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type OcrModel = {
  id: string;
  name: string;
  engine: string;
  version: string;
  sizeMb: number;
  sha256: string;
  foreignUrl: string;
  chinaMirrorUrl: string;
  fallbackPageUrl: string;
  description: string;
  languages: string[];
  scene: string;
  requiredAppVersion: string;
};

function readEnv(name: string, fallback = ''): string {
  return String(process.env[name] || fallback).trim();
}

function readNumberEnv(name: string, fallback = 0): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function readLanguages(): string[] {
  const raw = readEnv('OCR_MODEL_LANGUAGES', 'zh,en');
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildModel(): OcrModel {
  return {
    id: readEnv('OCR_MODEL_ID', 'paddleocr-lite-zh-en'),
    name: readEnv('OCR_MODEL_NAME', '增强本地 OCR'),
    engine: readEnv('OCR_MODEL_ENGINE', 'paddleocr'),
    version: readEnv('OCR_MODEL_VERSION', '2026.06'),
    sizeMb: readNumberEnv('OCR_MODEL_SIZE_MB', 22),
    sha256: readEnv('OCR_MODEL_SHA256', ''),
    foreignUrl: readEnv('OCR_MODEL_FOREIGN_URL', ''),
    chinaMirrorUrl: readEnv('OCR_MODEL_CHINA_MIRROR_URL', ''),
    fallbackPageUrl: readEnv('OCR_MODEL_FALLBACK_PAGE_URL', ''),
    description: readEnv(
      'OCR_MODEL_DESCRIPTION',
      '适合 IP 检测截图、小字、中英混排、复杂网页截图。'
    ),
    languages: readLanguages(),
    scene: readEnv('OCR_MODEL_SCENE', 'ip-check-screenshot'),
    requiredAppVersion: readEnv('OCR_MODEL_REQUIRED_APP_VERSION', '4.8.7'),
  };
}

export async function GET() {
  const model = buildModel();

  const configured = Boolean(
    model.sha256 &&
      (model.foreignUrl || model.chinaMirrorUrl || model.fallbackPageUrl)
  );

  return NextResponse.json(
    {
      ok: true,
      service: 'lingche-feedback-site',
      endpoint: '/api/ocr-models',
      schemaVersion: 1,
      defaultRegion: readEnv('OCR_DEFAULT_REGION', 'auto'),
      configured,
      models: [model],
      notes: [
        'foreignUrl 建议填写 GitHub Releases 直链。',
        'chinaMirrorUrl 建议填写国内可直连下载地址。',
        'fallbackPageUrl 可填写蓝奏云/123云盘分享页，供用户手动下载。',
        'App 下载后应校验 sha256，再解压到 App 私有目录。',
      ],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
