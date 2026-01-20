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
    const entityType = searchParams.get('entityType') || 'anime';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch top entities by wins for Hall of Fame
    const { data: topEntities, error: topError } = await supabaseAdmin
      .from('bracket_entity_stats')
      .select('*')
      .eq('entity_type', entityType)
      .order('wins_total', { ascending: false })
      .limit(limit);

    if (topError) {
      console.error("Error fetching Hall of Fame:", topError);
      return NextResponse.json({ error: topError.message }, { status: 500 });
    }

    // Transform data for frontend
    const hallOfFameEntries = (topEntities || []).map((entity, index) => ({
      id: entity.entity_id,
      title: `Entity ${entity.entity_id}`, // In real implementation, fetch actual title from AniList
      coverImage: `/api/placeholder/120/180`, // In real implementation, fetch actual image
      globalWins: entity.wins_total,
      allTimeRank: index + 1,
      thisWeekRank: index + 1, // Simplified - would need weekly tracking
      lastWeekRank: index + 2, // Simplified
      winRate: entity.appearances_total > 0 
        ? Math.round((entity.wins_total / entity.appearances_total) * 100 * 10) / 10
        : 0,
      averageSeed: 2.5, // Simplified - would need seed tracking
      biggestUpset: 5, // Simplified - would need upset tracking
    }));

    return NextResponse.json({
      success: true,
      entries: hallOfFameEntries,
      entityType,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Hall of Fame error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
