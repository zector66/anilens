import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: Request) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("type") ?? "character";

  try {
    // Get all daily records for this entity type
    const { data: daily, error: dailyError } = await supabase
      .from("bracket_entity_stats_daily")
      .select("*")
      .eq("entity_type", entityType)
      .order("day", { ascending: false });

    // Get all main records for comparison
    const { data: main, error: mainError } = await supabase
      .from("bracket_entity_stats")
      .select("*")
      .eq("entity_type", entityType)
      .order("wins_total", { ascending: false });

    return NextResponse.json({
      entityType,
      daily: {
        error: dailyError?.message,
        count: daily?.length || 0,
        records: daily?.slice(0, 10) || [] // First 10 records
      },
      main: {
        error: mainError?.message,
        count: main?.length || 0,
        records: main?.slice(0, 10) || [] // First 10 records
      },
      comparison: {
        dailyCount: daily?.length || 0,
        mainCount: main?.length || 0,
        discrepancy: (main?.length || 0) - (daily?.length || 0)
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
