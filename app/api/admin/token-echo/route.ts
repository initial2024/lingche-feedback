import { NextResponse } from 'next/server';
import { getAdminTokenShape } from '@/lib/admin-token';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headerToken = request.headers.get('x-admin-token');

  return NextResponse.json({
    ok: true,
    receivedHeaderPresent: headerToken !== null,
    received: getAdminTokenShape(headerToken || ''),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
