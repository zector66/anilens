import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const info = {
    timestamp: new Date().toISOString(),
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

  return NextResponse.json(info, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
