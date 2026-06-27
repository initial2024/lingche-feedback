import { NextResponse } from 'next/server';
import { siteConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'lingche-feedback-site',
    site: siteConfig.siteName,
    time: new Date().toISOString(),
  });
}
