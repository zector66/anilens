import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Test if the RPC function exists and works
    const { data, error } = await supabaseAdmin.rpc("process_bracket_results", {
      p_run_id: "00000000-0000-0000-0000-000000000000",
      p_bracket_type: "character",
      p_bracket_size: 16,
      p_results: [
        {
          entity_type: "character",
          winner_id: 1,
          loser_id: 2
        }
      ],
      p_champion_id: 1,
      p_user_id: null
    });

    if (error) {
      return NextResponse.json({ 
        error: "RPC function error", 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    // Check if tables exist and have data
    const { data: runs, error: runsError } = await supabaseAdmin
      .from("bracket_runs")
      .select("count")
      .limit(1);

    const { data: stats, error: statsError } = await supabaseAdmin
      .from("bracket_entity_stats")
      .select("count")
      .limit(1);

    return NextResponse.json({
      rpc: { success: true, data },
      tables: {
        bracket_runs: runsError ? { error: runsError.message } : { exists: true },
        bracket_entity_stats: statsError ? { error: statsError.message } : { exists: true }
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
