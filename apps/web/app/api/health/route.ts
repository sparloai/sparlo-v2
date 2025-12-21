import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 *
 * Used by Railway for deployment health checks.
 * Returns 200 OK when the server is ready to accept traffic.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
