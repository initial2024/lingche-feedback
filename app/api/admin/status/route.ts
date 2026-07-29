import { NextResponse } from 'next/server';
import { getAdminTokenShape } from '@/lib/admin-token';
import { securityConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminTokenShape = getAdminTokenShape(securityConfig.adminToken || '');

  return NextResponse.json({
    ok: true,
    service: 'lingche-feedback-site',
    adminTokenConfigured: !adminTokenShape.isEmptyAfterNormalize,
    adminTokenShape,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
