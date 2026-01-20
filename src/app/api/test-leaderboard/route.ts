import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Test if we can read from the bracket tables
    const { data: stats, error: statsError } = await supabase
      .from("bracket_entity_stats")
      .select("*")
      .limit(5);

    const { data: runs, error: runsError } = await supabase
      .from("bracket_runs")
      .select("*")
      .limit(5);

    const { data: daily, error: dailyError } = await supabase
      .from("bracket_entity_stats_daily")
      .select("*")
      .limit(5);

    return NextResponse.json({
      tables: {
        bracket_entity_stats: {
          exists: !statsError,
          error: statsError?.message,
          count: stats?.length || 0,
          sample: stats?.slice(0, 2) || []
        },
        bracket_runs: {
          exists: !runsError,
          error: runsError?.message,
          count: runs?.length || 0,
          sample: runs?.slice(0, 2) || []
        },
        bracket_entity_stats_daily: {
          exists: !dailyError,
          error: dailyError?.message,
          count: daily?.length || 0,
          sample: daily?.slice(0, 2) || []
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
