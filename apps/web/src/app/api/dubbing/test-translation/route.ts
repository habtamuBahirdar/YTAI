import { NextRequest, NextResponse } from 'next/server';
import { performTranslation } from '@/lib/addis-ai-service';

/**
 * POST /api/dubbing/test-translation
 * Test Translation service
 * 
 * Request:
 * {
 *   "text": "English text to translate",
 *   "userId": "user-id",
 *   "sessionId": "session-id"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, userId, sessionId } = body;

    if (!text || !userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: text, userId, sessionId' },
        { status: 400 }
      );
    }

    const result = await performTranslation(text, userId, sessionId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Translation test failed',
      },
      { status: 500 }
    );
  }
}
