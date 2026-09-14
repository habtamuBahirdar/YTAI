/**
 * POST /api/dubbing/test-tts-real
 * Test Text-to-Speech with Addis AI
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text = 'ወደ ኤዲስዳብ እንኳን ደህና መጡ።',
      voiceId = 'am-hamen',
      language = 'am',
    } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    // Call Addis AI TTS endpoint
    const response = await fetch('https://api.addisassistant.com/api/v1/voice/generations', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ADDIS_AI_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        language,
        outputFormat: 'mp3',
        speed: 1.0,
        clientRequestId: `test-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TTS API error: ${error}`);
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      service: 'TTS',
      text,
      voiceId,
      language,
      audioBase64,
      audioLength: audioBuffer.byteLength,
      estimatedCost: (text.length / 1000) * 0.015,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('TTS test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'TTS test failed',
      },
      { status: 500 }
    );
  }
}
