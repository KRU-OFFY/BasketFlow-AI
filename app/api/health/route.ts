import { NextResponse } from 'next/server';

import { evaluateDeploymentHealth } from '@/lib/deployment/health';

export const dynamic = 'force-dynamic';

export function GET() {
  const health = evaluateDeploymentHealth(process.env);

  return NextResponse.json(health, {
    status: health.httpStatus,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
