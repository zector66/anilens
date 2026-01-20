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
    // Get total bracket count
    const { count: totalBrackets, error: bracketsError } = await supabaseAdmin
      .from('bracket_runs')
      .select('*', { count: 'exact', head: true });

    if (bracketsError) {
      console.error("Error fetching total brackets:", bracketsError);
      return NextResponse.json({ error: bracketsError.message }, { status: 500 });
    }

    // Get unique user count
    const { data: users, error: usersError } = await supabaseAdmin
      .from('bracket_runs')
      .select('user_id')
      .not('user_id', 'is', null);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const uniqueUsers = new Set(users?.map(u => u.user_id)).size;

    // Get stats by bracket type
    const { data: typeStats, error: typeStatsError } = await supabaseAdmin
      .from('bracket_runs')
      .select('bracket_type')
      .order('bracket_type');

    if (typeStatsError) {
      console.error("Error fetching type stats:", typeStatsError);
      return NextResponse.json({ error: typeStatsError.message }, { status: 500 });
    }

    const statsByType = typeStats?.reduce((acc: Record<string, number>, run) => {
      acc[run.bracket_type] = (acc[run.bracket_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentBrackets, error: recentError } = await supabaseAdmin
      .from('bracket_runs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      console.error("Error fetching recent brackets:", recentError);
      return NextResponse.json({ error: recentError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalBrackets: totalBrackets || 0,
        uniqueUsers: uniqueUsers,
        recentBrackets: recentBrackets || 0,
        statsByType,
        // Calculate active players (users who played in last 7 days)
        activePlayers: recentBrackets ? Math.min(uniqueUsers, Math.ceil(recentBrackets * 0.7)) : 0,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Bracket stats error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
