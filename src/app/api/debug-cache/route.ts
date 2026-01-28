import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Module-level constant set at cold start
const COLD_START_TIME = Date.now();
const INSTANCE_ID = Math.random().toString(36).substring(2, 10);

let requestCount = 0;

export async function GET(request: NextRequest) {
  requestCount++;
  const now = Date.now();
  
  // Check various caching indicators
  const cacheInfo = {
    instance: {
      id: INSTANCE_ID,
      coldStartTime: new Date(COLD_START_TIME).toISOString(),
      uptime: `${Math.round((now - COLD_START_TIME) / 1000)}s`,
      requestCount: requestCount,
    },
    timing: {
      serverTime: new Date(now).toISOString(),
      serverTimestamp: now,
    },
    requestHeaders: {
      cacheControl: request.headers.get('cache-control'),
      pragma: request.headers.get('pragma'),
      ifNoneMatch: request.headers.get('if-none-match'),
      ifModifiedSince: request.headers.get('if-modified-since'),
      xVercelCache: request.headers.get('x-vercel-cache'),
      xNextjsCache: request.headers.get('x-nextjs-cache'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    },
    vercel: {
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    },
    diagnosis: [] as string[],
  };

  // Add diagnostic messages
  if (requestCount > 1) {
    cacheInfo.diagnosis.push(`This serverless instance has handled ${requestCount} requests (warm instance)`);
  } else {
    cacheInfo.diagnosis.push('Fresh cold start - this is a new serverless instance');
  }

  const response = NextResponse.json(cacheInfo, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'X-Instance-Id': INSTANCE_ID,
      'X-Request-Count': String(requestCount),
      'X-Server-Time': String(now),
    },
  });

  console.log(`[debug-cache] Instance ${INSTANCE_ID} | Request #${requestCount} | ${new Date(now).toISOString()}`);

  return response;
}
