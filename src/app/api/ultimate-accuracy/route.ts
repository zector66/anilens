/**
 * ULTIMATE ACCURACY API
 * 
 * Implements the "go nuclear" blueprint for maximum taste accuracy.
 * 
 * ENDPOINTS:
 * POST /api/ultimate-accuracy - Compute ultimate accuracy profile
 * 
 * FEATURES:
 * ✅ TF-IDF signature traits with real population data
 * ✅ Episode count weighting (sqrt(episodes/12) clamped)
 * ✅ Status weighting (completed=1.0, dropped=0.15, etc.)
 * ✅ Rating signal strength detection
 * ✅ Negative evidence from dropped/low scores
 * ✅ Exposure vs Preference split
 */

import { NextRequest, NextResponse } from 'next/server';
import { MediaListEntry } from '@/types/anilist';
import { 
  computeUltimateAccuracyV2,
  type UltimateAccuracyProfileV2
} from '@/lib/ultimate-accuracy-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid entries array required'
      }, { status: 400 });
    }

    // Validate and transform entries
    const validatedEntries: MediaListEntry[] = entries.map(entry => ({
      id: entry.id || 0,
      mediaId: entry.mediaId || entry.media?.id || 0,
      media: entry.media,
      status: entry.status || 'COMPLETED',
      score: entry.score || 0,
      progress: entry.progress || 0,
      progressVolumes: entry.progressVolumes,
      repeat: entry.repeat || 0,
      priority: entry.priority || 0,
      private: entry.private || false,
      notes: entry.notes || '',
      hiddenFromStatusLists: entry.hiddenFromStatusLists || false,
      customLists: entry.customLists || [],
      advancedScores: entry.advancedScores || {},
      startedAt: entry.startedAt || {},
      completedAt: entry.completedAt || {},
      updatedAt: entry.updatedAt || Date.now(),
      createdAt: entry.createdAt || Date.now(),
    }));

    // Compute ultimate accuracy profile with v2 fixes
    const accuracyProfile = await computeUltimateAccuracyV2(validatedEntries);

    // Return comprehensive accuracy results
    return NextResponse.json({
      success: true,
      data: {
        // Core accuracy models
        exposureProfile: accuracyProfile.exposureProfile,
        preferenceProfile: accuracyProfile.preferenceProfile,
        
        // Population context
        percentiles: accuracyProfile.percentiles,
        signatureTraits: accuracyProfile.signatureTraits,
        
        // Confidence metrics
        confidence: accuracyProfile.confidence,
        
        // Data quality metrics
        dataQuality: accuracyProfile.dataQuality,
        
        // Summary for quick UI display
        summary: {
          totalEntries: validatedEntries.length,
          topTraits: accuracyProfile.signatureTraits.slice(0, 5).map((t: any) => ({
            name: t.name,
            rawScore: t.rawScore,
            category: t.category,
            percentile: accuracyProfile.percentiles.find((p: any) => p.traitId === t.traitId)?.percentile || 0,
            rarity: accuracyProfile.percentiles.find((p: any) => p.traitId === t.traitId)?.rarity || 'common'
          })),
          confidence: accuracyProfile.confidence.overall,
          dataQuality: {
            ratingSignalStrength: accuracyProfile.dataQuality.ratingVariance > 2 ? 'strong' : 'weak',
            episodeWeighting: accuracyProfile.dataQuality.episodeWeighting,
            statusDistribution: accuracyProfile.dataQuality.statusDistribution
          }
        }
      }
    });

  } catch (error) {
    console.error('Ultimate accuracy API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to compute ultimate accuracy',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Ultimate Accuracy API is running',
    features: [
      'TF-IDF signature traits',
      'Episode count weighting',
      'Status weighting',
      'Rating signal strength detection',
      'Negative evidence from dropped/low scores',
      'Exposure vs Preference split',
      'Realistic confidence scoring',
      'Population percentiles'
    ]
  });
}
