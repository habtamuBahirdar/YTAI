/**
 * POST /api/dubbing/test-stt
 * Test Speech-to-Text with Addis AI
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioBase64 } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'audioBase64 is required' },
        { status: 400 }
      );
    }

    // Call Addis AI STT endpoint
    const response = await fetch('https://api.addisassistant.com/api/v2/stt', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ADDIS_AI_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBase64,
        language: 'en',
        model: 'addis-whisper',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`STT API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      service: 'STT',
      transcript: result.text,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('STT test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'STT test failed',
      },
      { status: 500 }
    );
  }
}
