import { NextRequest, NextResponse } from 'next/server';
import { performTTS } from '@/lib/addis-ai-service';

/**
 * POST /api/dubbing/test-tts
 * Test Text-to-Speech service
 * 
 * Request:
 * {
 *   "text": "Amharic text to synthesize",
 *   "userId": "user-id",
 *   "sessionId": "session-id",
 *   "voice": "am-ET-Neural2-A" (optional),
 *   "speed": 1.0 (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, userId, sessionId, voice, speed } = body;

    if (!text || !userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, userId, sessionId' },
        { status: 400 }
      );
    }

    const result = await performTTS(text, userId, sessionId, { voice, speed });

    // Convert audio buffer to base64 for JSON response
    const response = {
      ...result,
    };

    if (result.data?.audioBuffer) {
      response.data = {
        ...result.data,
        audioBuffer: result.data.audioBuffer.toString('base64'),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'TTS test failed',
      },
      { status: 500 }
    );
  }
}
