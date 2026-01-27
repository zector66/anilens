import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Force Node.js runtime to avoid Edge runtime issues with imports/crypto/Buffer
export const runtime = 'nodejs';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

/**
 * POST /api/genome/snapshot
 * Save a new genome snapshot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      anilistId,
      mediaType,
      vector,
      tagBuckets,
      dominantTraits,
      entropy,
      uniquenessScore,
      dimSummary,
      genomeVersion,
      listHash,
      entryCount
    } = body;

    if (!anilistId || !mediaType || !vector) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getSupabase();

    // Check if we already have a recent snapshot (within 24 hours)
    const { data: recent } = await db
      .from('taste_genome_snapshots')
      .select('id, created_at')
      .eq('anilist_id', anilistId)
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recent) {
      const hoursSinceLastSnapshot = 
        (Date.now() - new Date(recent.created_at).getTime()) / (1000 * 60 * 60);
      
      // Don't save if less than 24 hours since last snapshot
      if (hoursSinceLastSnapshot < 24) {
        return NextResponse.json({
          success: false,
          message: 'Snapshot already exists within 24 hours',
          lastSnapshot: recent.created_at
        });
      }
    }

    // Insert new snapshot
    const { data, error } = await db
      .from('taste_genome_snapshots')
      .insert({
        anilist_id: anilistId,
        media_type: mediaType,
        vector,
        tag_buckets: tagBuckets,
        dominant_traits: dominantTraits,
        entropy,
        uniqueness_score: uniquenessScore,
        dim_summary: dimSummary,
        genome_version: genomeVersion,
        list_hash: listHash,
        entry_count: entryCount
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving genome snapshot:', error);
      return NextResponse.json(
        { error: 'Failed to save snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshot: data
    });
  } catch (error) {
    console.error('Genome snapshot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/genome/snapshot?anilistId=123&mediaType=ANIME&limit=12
 * Get genome snapshot history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anilistId = searchParams.get('anilistId');
    const mediaType = searchParams.get('mediaType') || 'ANIME';
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    if (!anilistId) {
      // Return empty instead of error - snapshots are optional
      return NextResponse.json({
        snapshots: [],
        count: 0
      });
    }

    const db = getSupabase();

    const { data, error } = await db
      .from('taste_genome_snapshots')
      .select('*')
      .eq('anilist_id', parseInt(anilistId, 10))
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Log error but return empty - snapshots are optional cache
      console.warn('[SNAPSHOT FETCH FAILED - RETURNING EMPTY]', error);
      return NextResponse.json({
        snapshots: [],
        count: 0
      });
    }

    // Return 200 with empty array if no snapshots exist (cache miss)
    if (!data || data.length === 0) {
      return NextResponse.json({
        snapshots: [],
        count: 0
      });
    }

    // Transform to camelCase for frontend
    const snapshots = data.map(row => ({
      id: row.id,
      anilistId: row.anilist_id,
      mediaType: row.media_type,
      vector: row.vector,
      tagBuckets: row.tag_buckets,
      dominantTraits: row.dominant_traits,
      entropy: row.entropy,
      uniquenessScore: row.uniqueness_score,
      dimSummary: row.dim_summary,
      genomeVersion: row.genome_version,
      listHash: row.list_hash,
      entryCount: row.entry_count,
      createdAt: new Date(row.created_at)
    }));

    return NextResponse.json({
      snapshots,
      count: snapshots.length
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[SNAPSHOT_500]', err?.stack || error);
    return NextResponse.json(
      { 
        error: 'snapshot_failed', 
        message: String(err?.message || error),
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/genome/snapshot
 * Delete all cached snapshots for a user to force refresh
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const db = getSupabase();

    // Delete from taste_genome_snapshots
    const { error: genomeError } = await db
      .from('taste_genome_snapshots')
      .delete()
      .eq('anilist_id', userId);

    if (genomeError) {
      console.warn('Error deleting genome snapshots:', genomeError);
    }

    // Delete from taste_snapshots (if it exists)
    const { error: tasteError } = await db
      .from('taste_snapshots')
      .delete()
      .eq('user_id', userId);

    if (tasteError) {
      console.warn('Error deleting taste snapshots:', tasteError);
    }

    // Delete from taste_profile_cache (if it exists)
    const { error: cacheError } = await db
      .from('taste_profile_cache')
      .delete()
      .eq('user_id', userId);

    if (cacheError) {
      console.warn('Error deleting taste profile cache:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: 'All cached data cleared for user'
    });
  } catch (error) {
    console.error('Delete snapshot error:', error);
    return NextResponse.json(
      { error: 'Failed to delete snapshots' },
      { status: 500 }
    );
  }
}
