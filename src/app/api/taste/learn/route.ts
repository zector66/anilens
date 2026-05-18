/**
 * Taste Learning API
 * 
 * POST /api/taste/learn
 * Trains a per-user ridge regression model on prediction residuals.
 * 
 * Query params:
 * - userId: number (required)
 * - mediaType: 'ANIME' | 'MANGA' (default: 'ANIME')
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserResiduals, getUserByAnilistId, storeUserModelWeights } from '@/lib/db';
import { trainRidgeRegression } from '@/lib/ridge-regression';

const MIN_SAMPLES = 15;
const LAMBDA = 1.0;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '', 10);
    const mediaType = (searchParams.get('mediaType') || 'ANIME') as 'ANIME' | 'MANGA';

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    // Verify user exists
    const user = await getUserByAnilistId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch residuals with actual scores
    const residuals = await getUserResiduals(userId, mediaType, 500);

    if (!residuals || residuals.length < MIN_SAMPLES) {
      return NextResponse.json({
        trained: false,
        reason: `Need at least ${MIN_SAMPLES} rated anime. You have ${residuals?.length || 0}.`,
        sampleCount: residuals?.length || 0,
      });
    }

    // Build feature/label arrays
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

    if (features.length < MIN_SAMPLES) {
      return NextResponse.json({
        trained: false,
        reason: `Need at least ${MIN_SAMPLES} residuals with features. Found ${features.length}.`,
        sampleCount: features.length,
      });
    }

    // Train ridge regression
    const result = trainRidgeRegression(features, labels, LAMBDA);

    if (!result) {
      return NextResponse.json({
        trained: false,
        reason: 'Matrix inversion failed — features may be collinear.',
      });
    }

    // Store learned weights
    await storeUserModelWeights(
      userId,
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
    console.error('[Taste Learn] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
