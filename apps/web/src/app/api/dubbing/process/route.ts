import { NextRequest, NextResponse } from 'next/server';
import { processDubbingPipeline, estimateProcessingCost } from '@/lib/addis-ai-service';
import { updateSessionStatus, updateAudioSegment } from '@/lib/db-utils';

/**
 * POST /api/dubbing/process
 * Process audio through complete dubbing pipeline (STT → Translation → TTS)
 * 
 * Request:
 * {
 *   "audioBuffer": "base64-encoded-audio",
 *   "sessionId": "session-id",
 *   "userId": "user-id"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioBuffer: audioBase64, sessionId, userId } = body;

    if (!audioBase64 || !sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: audioBuffer, sessionId, userId' },
        { status: 400 }
      );
    }

    // Decode base64 audio
    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid audio buffer encoding' },
        { status: 400 }
      );
    }

    // Update session status to processing
    await updateSessionStatus(sessionId, 'processing', 10);

    // Process through pipeline
    const result = await processDubbingPipeline(
      audioBuffer,
      userId,
      sessionId,
      async (stage: string, progress: number) => {
        // Update progress (10-90% range for processing)
        const stageProgressMap: Record<string, number> = {
          stt: 30,
          translation: 60,
          tts: 90,
        };

        const stageProgress = stageProgressMap[stage] || 50;
        await updateSessionStatus(sessionId, 'processing', stageProgress);
      }
    );

    if (!result.success) {
      await updateSessionStatus(sessionId, 'failed', 0);
      return NextResponse.json(
        { error: result.stages.stt.error || 'Dubbing pipeline failed' },
        { status: 500 }
      );
    }

    // Update session to completed
    await updateSessionStatus(sessionId, 'completed', 100);

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      translation: result.translation,
      audio: result.audioBuffer?.toString('base64'),
      costs: {
        stt: result.stages.stt.cost,
        translation: result.stages.translation.cost,
        tts: result.stages.tts.cost,
        total: result.totalCost,
      },
      processing: {
        sttDuration: result.stages.stt.duration,
        translationDuration: result.stages.translation.duration,
        ttsDuration: result.stages.tts.duration,
        totalDuration:
          result.stages.stt.duration +
          result.stages.translation.duration +
          result.stages.tts.duration,
      },
    });
  } catch (error) {
    console.error('Dubbing process error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
