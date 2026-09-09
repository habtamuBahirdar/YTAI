import { NextRequest, NextResponse } from 'next/server';
import { estimateProcessingCost } from '@/lib/addis-ai-service';

/**
 * POST /api/dubbing/estimate-cost
 * Estimate the cost for processing audio
 * 
 * Request:
 * {
 *   "estimatedAudioDurationSeconds": 60,
 *   "estimatedTextLength": 1000
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { estimatedAudioDurationSeconds = 60, estimatedTextLength = 1000 } = body;

    const costEstimate = await estimateProcessingCost(
      estimatedAudioDurationSeconds,
      estimatedTextLength
    );

    return NextResponse.json({
      success: true,
      estimate: costEstimate,
      breakdown: {
        stt: {
          cost: costEstimate.stt,
          description: `Speech-to-Text (${estimatedAudioDurationSeconds}s audio)`,
        },
        translation: {
          cost: costEstimate.translation,
          description: `Translation (~${estimatedTextLength} characters)`,
        },
        tts: {
          cost: costEstimate.tts,
          description: `Text-to-Speech (~${estimatedTextLength} characters)`,
        },
      },
      total: costEstimate.total,
      currency: 'USD',
    });
  } catch (error) {
    console.error('Cost estimation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Cost estimation failed',
      },
      { status: 500 }
    );
  }
}
