/**
 * POST /api/dubbing/test-translation
 * Test Translation with Addis AI
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text = 'Welcome to AddisDub. This is a test of the translation engine.' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    // Call Addis AI Translation endpoint (using chat_generate)
    const response = await fetch('https://api.addisassistant.com/api/v1/chat_generate', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ADDIS_AI_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following English text to Amharic.

Important:
- Preserve technical terms (React, API, GitHub, etc.)
- Keep names and numbers unchanged
- Maintain sentence structure and context
- Use natural spoken Amharic, not literal translation
- Preserve punctuation and formatting`,
          },
          {
            role: 'user',
            content: `Translate to Amharic:\n\n${text}`,
          },
        ],
        model: 'Addis-፩-አሌፍ',
        temperature: 0.3,
        maxTokens: 2000,
        language: 'am',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Translation API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      service: 'Translation',
      sourceLanguage: 'en',
      targetLanguage: 'am',
      sourceText: text,
      translatedText: result.response_text,
      tokenUsage: result.usage_metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Translation test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Translation test failed',
      },
      { status: 500 }
    );
  }
}
