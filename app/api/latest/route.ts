import { NextResponse } from 'next/server';
import { getLatestPayload } from '@/lib/latest';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getLatestPayload(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
