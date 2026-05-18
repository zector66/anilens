/**
 * Global Taste Learning API
 * 
 * POST /api/taste/learn/global
 * Trains a global ridge regression model on ALL users' residuals.
 * Used for cold-start users who don't have enough personal data.
 * 
 * Query params:
 * - mediaType: 'ANIME' | 'MANGA' (default: 'ANIME')
 * - secret: ADMIN_SECRET env var (required for protection)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllResidualsForGlobalTraining, storeGlobalModelWeights } from '@/lib/db';
import { trainRidgeRegression } from '@/lib/ridge-regression';

const MIN_GLOBAL_SAMPLES = 100;
const LAMBDA = 1.0;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = (searchParams.get('mediaType') || 'ANIME') as 'ANIME' | 'MANGA';
    const secret = searchParams.get('secret') || '';

    // Protect global training with admin secret
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const residuals = await getAllResidualsForGlobalTraining(mediaType, 5000);

    if (!residuals || residuals.length < MIN_GLOBAL_SAMPLES) {
      return NextResponse.json({
        trained: false,
        reason: `Need at least ${MIN_GLOBAL_SAMPLES} global residuals. Have ${residuals?.length || 0}.`,
        sampleCount: residuals?.length || 0,
      });
    }

    const features: Record<string, number>[] = [];
    const labels: number[] = [];

    for (const r of residuals) {
      if (r.actual_score == null) continue;
      const feats = typeof r.features_json === 'string'
        ? JSON.parse(r.features_json)
        : r.features_json;
      if (feats && typeof feats === 'object') {
        features.push(feats);
        labels.push(Number(r.actual_score));
      }
    }

    if (features.length < MIN_GLOBAL_SAMPLES) {
      return NextResponse.json({
        trained: false,
        reason: `Need at least ${MIN_GLOBAL_SAMPLES} usable residuals. Found ${features.length}.`,
        sampleCount: features.length,
      });
    }

    const result = trainRidgeRegression(features, labels, LAMBDA);

    if (!result) {
      return NextResponse.json({
        trained: false,
        reason: 'Matrix inversion failed — features may be collinear.',
      });
    }

    await storeGlobalModelWeights(
      mediaType,
      result.weights,
      result.featureNames,
      result.bias,
      result.rSquared,
      result.rmse,
      result.sampleCount,
      'v3'
    );

    return NextResponse.json({
      trained: true,
      sampleCount: result.sampleCount,
      rSquared: result.rSquared,
      rmse: result.rmse,
      bias: result.bias,
      weights: result.weights,
    });
  } catch (error) {
    console.error('[Global Taste Learn] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
