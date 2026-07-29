import { NextResponse } from 'next/server';
import { securityConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'lingche-feedback-site',
    adminTokenConfigured: Boolean(securityConfig.adminToken.trim()),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
