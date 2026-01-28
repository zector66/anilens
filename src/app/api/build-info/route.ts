import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Build-time constants for cache detection
const BUILD_TIME = Date.now();
const BUILD_ID = Math.random().toString(36).slice(2, 8);

export async function GET() {
  const now = Date.now();
  
  const info = {
    debug: {
      buildTime: new Date(BUILD_TIME).toISOString(),
      requestTime: new Date(now).toISOString(),
      buildId: BUILD_ID,
      requestId: Math.random().toString(36).slice(2, 8),
      isFresh: BUILD_TIME !== now ? 'YES' : 'MAYBE_CACHED',
    },
    nodeEnv: process.env.NODE_ENV,
    vercel: {
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    },
    git: {
      sha: process.env.VERCEL_GIT_COMMIT_SHA,
      ref: process.env.VERCEL_GIT_COMMIT_REF,
    },
  };

  return NextResponse.json(info, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
