/**
 * Auto Global Model Retraining
 * 
 * GET /api/taste/learn/global/auto
 * Checks if global model is stale (>7 days) and retrains if so.
 * No secret required — uses ADMIN_SECRET from environment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGlobalModelWeights, getAllResidualsForGlobalTraining, storeGlobalModelWeights } from '@/lib/db';
import { trainRidgeRegression } from '@/lib/ridge-regression';

const MIN_GLOBAL_SAMPLES = 100;
const LAMBDA = 1.0;
const STALE_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = (searchParams.get('mediaType') || 'ANIME') as 'ANIME' | 'MANGA';

    // Check current global model
    const current = await getGlobalModelWeights(mediaType, 'v3');

    if (current) {
      const trainedAt = new Date(current.trained_at);
      const ageDays = (Date.now() - trainedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < STALE_DAYS) {
        return NextResponse.json({
          retrained: false,
          reason: `Global model is fresh (${Math.round(ageDays)} days old).`,
          sampleCount: current.sample_count,
        });
      }
    }

    // Retrain
    const residuals = await getAllResidualsForGlobalTraining(mediaType, 5000);

    if (!residuals || residuals.length < MIN_GLOBAL_SAMPLES) {
      return NextResponse.json({
        retrained: false,
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
        retrained: false,
        reason: `Need at least ${MIN_GLOBAL_SAMPLES} usable residuals. Found ${features.length}.`,
        sampleCount: features.length,
      });
    }

    const result = trainRidgeRegression(features, labels, LAMBDA);

    if (!result) {
      return NextResponse.json({
        retrained: false,
        reason: 'Matrix inversion failed.',
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
      retrained: true,
      sampleCount: result.sampleCount,
      rSquared: result.rSquared,
      rmse: result.rmse,
    });
  } catch (error) {
    console.error('[Auto Global Learn] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
