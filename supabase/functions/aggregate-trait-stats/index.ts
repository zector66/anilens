import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function: Aggregate Trait Statistics
 * 
 * Scans all taste_profile_cache entries and computes real trait frequencies
 * across the userbase. Updates global_trait_stats table.
 * 
 * Trigger: Can be called manually, via cron, or after user profile updates
 * 
 * Authorization: Requires service_role key (admin only)
 */

interface TraitFrequency {
  traitId: string;
  traitName: string;
  category: string;
  count: number;
  totalUsers: number;
  avgScore: number;
}

serve(async (req) => {
  // Check authorization
  const authHeader = req.headers.get('authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Service role key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Simple auth check - bearer token should be service role key
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('[AggregateTraits] Starting trait frequency aggregation...');

    // Fetch all taste profiles
    const { data: profiles, error: profileError } = await supabase
      .from('taste_profile_cache')
      .select('user_id, type, profile');

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No profiles found',
        updated: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const totalUsers = profiles.length;
    const traitMap = new Map<string, TraitFrequency>();

    // Aggregate traits across all profiles
    for (const profile of profiles) {
      const tasteProfile = profile.profile as any;
      if (!tasteProfile?.topTraits) continue;

      // Get identity, vibe, structure, intensity channels
      const channels = [
        ...(tasteProfile.channels?.identity || []),
        ...(tasteProfile.channels?.vibe || []),
        ...(tasteProfile.channels?.structure || []),
        ...(tasteProfile.channels?.intensity || []),
      ];

      for (const trait of channels) {
        const traitId = trait.traitId?.toLowerCase();
        if (!traitId) continue;

        const existing = traitMap.get(traitId);
        if (existing) {
          existing.count++;
          existing.avgScore += trait.enjoymentScore || 0;
        } else {
          traitMap.set(traitId, {
            traitId,
            traitName: trait.name || traitId,
            category: trait.channel || 'tag',
            count: 1,
            totalUsers,
            avgScore: trait.enjoymentScore || 0,
          });
        }
      }
    }

    // Convert to array and calculate frequencies
    const traitStats = Array.from(traitMap.values()).map(t => ({
      trait_id: t.traitId,
      trait_name: t.traitName,
      trait_category: t.category,
      user_count: t.count,
      total_users: totalUsers,
      frequency_ratio: Math.round((t.count / totalUsers) * 10000) / 10000,
      avg_score: t.count > 0 ? Math.round((t.avgScore / t.count) * 100) / 100 : null,
      updated_at: new Date().toISOString(),
    }));

    // Upsert into global_trait_stats
    const { error: upsertError } = await supabase
      .from('global_trait_stats')
      .upsert(traitStats, { onConflict: 'trait_id' });

    if (upsertError) throw upsertError;

    console.log(`[AggregateTraits] Updated ${traitStats.length} trait frequencies from ${totalUsers} profiles`);

    return new Response(JSON.stringify({
      success: true,
      totalUsers,
      traitsUpdated: traitStats.length,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AggregateTraits] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
