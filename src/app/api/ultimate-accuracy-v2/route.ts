/**
 * ULTIMATE ACCURACY API V2
 * 
 * Fixes the "Gintama everywhere" problem with:
 * ✅ Per-title spread normalization
 * ✅ Centered preference weighting  
 * ✅ Core vs Modifier caps
 * ✅ Enhanced debug tracing
 * ✅ Exposure vs Preference split
 */

import { NextRequest, NextResponse } from 'next/server';
import { MediaListEntry } from '@/types/anilist';
import { computeUltimateAccuracyV2, type UltimateAccuracyProfileV2 } from '@/lib/ultimate-accuracy-v2';
import { checkTitleTraitSpread } from '@/lib/ultimate-accuracy-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries } = body;

    // Validate input
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Invalid input: entries array required' },
        { status: 400 }
      );
    }

    // Validate entries structure
    for (const entry of entries) {
      if (!entry.mediaId || !entry.status) {
        return NextResponse.json(
          { error: 'Invalid entry: mediaId and status required' },
          { status: 400 }
        );
      }
    }

    console.log(`🎯 ULTIMATE ACCURACY V2: Processing ${entries.length} entries`);

    // Compute ultimate accuracy profile with all fixes
    const accuracyProfile = await computeUltimateAccuracyV2(entries as MediaListEntry[]);

    // Check for problematic titles (Gintama everywhere problem)
    const problematicTitles: Array<{mediaId: number; traitCount: number; title?: string}> = [];
    
    // Get unique media IDs from entries
    const uniqueMediaIds = [...new Set(entries.map((e: any) => e.mediaId))];
    
    for (const mediaId of uniqueMediaIds) {
      const spreadCheck = checkTitleTraitSpread(mediaId, accuracyProfile);
      if (spreadCheck.isProblematic) {
        const entry = entries.find((e: any) => e.mediaId === mediaId);
        problematicTitles.push({
          mediaId,
          traitCount: spreadCheck.traitCount,
          title: entry?.media?.title?.userPreferred || `Media ${mediaId}`
        });
      }
    }

    // Log warnings for problematic titles
    if (problematicTitles.length > 0) {
      console.log(`⚠️  DETECTED ${problematicTitles.length} PROBLEMATIC TITLES:`);
      problematicTitles.forEach(({title, traitCount}) => {
        console.log(`   - ${title}: contributing to ${traitCount} traits (too many!)`);
      });
    }

    const response = {
      success: true,
      data: accuracyProfile,
      warnings: {
        problematicTitles: problematicTitles.length,
        titles: problematicTitles
      },
      meta: {
        version: 'v2',
        fixes: [
          'Per-title spread normalization',
          'Centered preference weighting',
          'Conservative episode weighting',
          'Core vs modifier classification',
          'Enhanced debug tracing'
        ],
        processedAt: new Date().toISOString()
      }
    };

    console.log(`✅ ULTIMATE ACCURACY V2: Complete`);
    console.log(`   - Overall Confidence: ${Math.round(accuracyProfile.confidence.overall * 100)}%`);
    console.log(`   - Sample Size: ${accuracyProfile.confidence.sampleSize}`);
    console.log(`   - Signature Traits: ${accuracyProfile.signatureTraits.length}`);
    console.log(`   - Problematic Titles: ${problematicTitles.length}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ ULTIMATE ACCURACY V2 ERROR:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: 'v2',
    description: 'Ultimate Accuracy API V2 - Fixes "Gintama everywhere" problem',
    features: [
      'Per-title spread normalization',
      'Centered preference weighting',
      'Conservative episode weighting',
      'Core vs modifier classification',
      'Enhanced debug tracing',
      'Exposure vs Preference split'
    ],
    endpoints: {
      POST: '/api/ultimate-accuracy-v2',
      description: 'Compute ultimate accuracy profile with V2 fixes'
    }
  });
}
