import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Module-level constants set at cold start
const COLD_START = Date.now();
const INSTANCE_ID = Math.random().toString(36).slice(2, 8);
let requestCount = 0;

export async function GET() {
  requestCount++;
  const now = Date.now();
  
  const info = {
    instance: {
      id: INSTANCE_ID,
      coldStart: new Date(COLD_START).toISOString(),
      uptime: `${Math.round((now - COLD_START) / 1000)}s`,
      requests: requestCount,
    },
    time: new Date(now).toISOString(),
    vercel: {
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    },
  };

  return NextResponse.json(info, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
