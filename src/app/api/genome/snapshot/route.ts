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
      return NextResponse.json(
        { error: 'anilistId is required' },
        { status: 400 }
      );
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
      console.error('Error fetching genome snapshots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch snapshots' },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const snapshots = (data || []).map(row => ({
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
