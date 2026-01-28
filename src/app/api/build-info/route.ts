import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// This is set at BUILD TIME - if this matches runtime, the route is fresh
const BUILD_TIMESTAMP = new Date().toISOString();
const BUILD_RANDOM = Math.random().toString(36).substring(7);

export async function GET(request: NextRequest) {
  const runtimeTimestamp = new Date().toISOString();
  const runtimeRandom = Math.random().toString(36).substring(7);
  
  const info = {
    debug: {
      buildTimestamp: BUILD_TIMESTAMP,
      runtimeTimestamp: runtimeTimestamp,
      buildRandom: BUILD_RANDOM,
      runtimeRandom: runtimeRandom,
      isCached: BUILD_TIMESTAMP === runtimeTimestamp ? 'POSSIBLY - timestamps match' : 'NO - timestamps differ',
      staticBuildCheck: BUILD_RANDOM === runtimeRandom ? 'CACHED - same random' : 'FRESH - different random',
    },
    request: {
      url: request.url,
      method: request.method,
      cacheHeader: request.headers.get('cache-control'),
      pragma: request.headers.get('pragma'),
      ifNoneMatch: request.headers.get('if-none-match'),
      ifModifiedSince: request.headers.get('if-modified-since'),
    },
    nodeEnv: process.env.NODE_ENV,
    vercel: {
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
      projectId: process.env.VERCEL_PROJECT_ID,
    },
    git: {
      sha: process.env.VERCEL_GIT_COMMIT_SHA,
      ref: process.env.VERCEL_GIT_COMMIT_REF,
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE,
      repo: process.env.VERCEL_GIT_REPO_SLUG,
      owner: process.env.VERCEL_GIT_REPO_OWNER,
    },
  };

  console.log('[build-info] Request received:', JSON.stringify(info, null, 2));

  return NextResponse.json(info, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Build-Timestamp': BUILD_TIMESTAMP,
      'X-Runtime-Timestamp': runtimeTimestamp,
    },
  });
}
