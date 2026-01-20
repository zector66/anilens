import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch bracket runs for user or all runs
    let query = supabaseAdmin
      .from('bracket_runs')
      .select(`
        id,
        bracket_type,
        bracket_size,
        user_id,
        created_at,
        processed_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', parseInt(userId));
    }

    const { data: runs, error: runsError } = await query;

    if (runsError) {
      console.error("Error fetching bracket runs:", runsError);
      return NextResponse.json({ error: runsError.message }, { status: 500 });
    }

    // For each run, we need to get the winner from the stats
    // This is a simplified approach - in a real implementation, we'd store the winner in the runs table
    const bracketHistory = await Promise.all(
      (runs || []).map(async (run) => {
        // Get the champion for this bracket type
        const { data: championData } = await supabaseAdmin
          .from('bracket_entity_stats')
          .select('*')
          .eq('entity_type', run.bracket_type)
          .eq('championships_total', 1) // This is a simplified approach
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: run.id,
          tournamentName: `${run.bracket_type.charAt(0).toUpperCase() + run.bracket_type.slice(1)} Bracket ${new Date(run.created_at).toLocaleDateString()}`,
          battleType: run.bracket_type as 'anime' | 'manga' | 'openings' | 'endings' | 'characters',
          bracketSize: run.bracket_size,
          completedAt: run.processed_at || run.created_at,
          winner: championData ? {
            id: championData.entity_id,
            title: `Entity ${championData.entity_id}`, // In real implementation, fetch actual title
            image: `/api/placeholder/120/180`, // In real implementation, fetch actual image
          } : {
            id: 0,
            title: 'Unknown',
            image: '/api/placeholder/120/180',
          },
          config: {
            seedingMode: 'hybrid' as const,
            formatFilters: ['TV', 'MOVIE'] as const,
            statusFilters: ['COMPLETED'] as const,
            noSequels: false,
            highConfidenceOnly: false,
            excludeAdult: true,
            difficultyLevel: 30,
            tournamentName: `${run.bracket_type.charAt(0).toUpperCase() + run.bracket_type.slice(1)} Bracket`,
            bracketSize: run.bracket_size as 16 | 32 | 64,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      history: bracketHistory,
      total: bracketHistory.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Bracket history error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
