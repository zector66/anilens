/**
 * Emotional Profile Feedback API
 * 
 * Collects anonymized feedback for improving the global emotional model.
 * This is opt-in only - users must explicitly choose to share feedback.
 * 
 * POST /api/feedback
 * - Stores aggregated feedback in Supabase
 * - No personal identifiable information is stored
 * - Used for weekly model updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only process in production or with explicit opt-in
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface FeedbackPayload {
  /** Anonymous session ID (not user ID) */
  sessionId: string;
  /** Media type */
  mediaType: 'ANIME' | 'MANGA';
  /** Model version feedback is for */
  modelVersion: string;
  /** Per-emotion feedback counts */
  emotions: Record<string, {
    tooHighCount: number;
    accurateCount: number;
    tooLowCount: number;
    avgScoreWhenTooHigh: number;
    avgScoreWhenTooLow: number;
  }>;
  /** Overall accuracy feedback */
  overallAccurate: number;
  overallSomewhat: number;
  overallInaccurate: number;
  /** Timestamp */
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'Feedback collection not configured' },
        { status: 503 }
      );
    }

    const payload: FeedbackPayload = await request.json();

    // Validate payload
    if (!payload.sessionId || !payload.mediaType || !payload.modelVersion) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Insert feedback record
    const { error } = await supabase
      .from('emotional_feedback')
      .insert({
        session_id: payload.sessionId,
        media_type: payload.mediaType,
        model_version: payload.modelVersion,
        emotions_data: payload.emotions,
        overall_accurate: payload.overallAccurate,
        overall_somewhat: payload.overallSomewhat,
        overall_inaccurate: payload.overallInaccurate,
        created_at: payload.timestamp,
      });

    if (error) {
      console.error('[Feedback API] Error storing feedback:', error);
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Emotional feedback collection endpoint',
    methods: ['POST'],
    schema: {
      sessionId: 'string (anonymous)',
      mediaType: 'ANIME | MANGA',
      modelVersion: 'string',
      emotions: 'Record<emotion, { tooHighCount, accurateCount, tooLowCount, avgScoreWhenTooHigh, avgScoreWhenTooLow }>',
      overallAccurate: 'number',
      overallSomewhat: 'number',
      overallInaccurate: 'number',
      timestamp: 'ISO string',
    },
  });
}
