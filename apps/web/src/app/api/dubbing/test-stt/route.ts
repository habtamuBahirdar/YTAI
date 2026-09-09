import { NextRequest, NextResponse } from 'next/server';
import { performSTT, performTranslation, performTTS } from '@/lib/addis-ai-service';

/**
 * POST /api/dubbing/test-stt
 * Test Speech-to-Text service
 * 
 * Request:
 * {
 *   "audioBuffer": "base64-encoded-audio",
 *   "userId": "user-id",
 *   "sessionId": "session-id"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioBuffer: audioBase64, userId, sessionId } = body;

    if (!audioBase64 || !userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const result = await performSTT(audioBuffer, userId, sessionId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'STT test failed',
      },
      { status: 500 }
    );
  }
}
