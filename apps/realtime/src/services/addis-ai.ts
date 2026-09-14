/**
 * Addis AI Client
 * Core wrapper for Addis AI API integration
 */

import axios from 'axios';

const ADDIS_API_BASE = 'https://api.addisassistant.com';
const ADDIS_API_KEY = process.env.ADDIS_AI_API_KEY;

if (!ADDIS_API_KEY) {
  throw new Error('Missing ADDIS_AI_API_KEY environment variable');
}

const addisClient = axios.create({
  baseURL: ADDIS_API_BASE,
  headers: {
    'x-api-key': ADDIS_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface STTRequest {
  audio: Buffer | string; // base64 encoded audio
  language?: 'am' | 'om' | 'en';
  model?: string;
}

export interface STTResponse {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage?: 'en' | 'am' | 'om';
  targetLanguage: 'am' | 'om' | 'en';
  model?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  language: 'am' | 'om';
  outputFormat?: 'mp3' | 'wav' | 'mp3_44100' | 'mp3_16000';
  speed?: number; // 0.5 to 2.0
  clientRequestId?: string;
}

export interface TTSResponse {
  audioUrl?: string;
  audio?: Buffer;
  audioBase64?: string;
  duration?: number;
  estimatedCost?: number;
}

/**
 * Speech-to-Text (STT)
 * Convert English audio to transcript
 */
export async function speechToText(request: STTRequest): Promise<STTResponse> {
  try {
    // Convert buffer to base64 if needed
    const audioBase64 = typeof request.audio === 'string' 
      ? request.audio 
      : request.audio.toString('base64');

    const response = await addisClient.post('/api/v2/stt', {
      audio: audioBase64,
      language: request.language || 'en',
      model: request.model || 'addis-whisper',
    });

    return {
      text: response.data.text || '',
      confidence: response.data.confidence,
      language: response.data.language,
      duration: response.data.duration,
    };
  } catch (error: any) {
    console.error('STT Error:', error.response?.data || error.message);
    throw new Error(`STT failed: ${error.message}`);
  }
}

/**
 * Translation (English → Amharic/Oromo)
 * Translate transcript using LLM
 */
export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const systemPrompt = `You are a professional translator. Translate the following English text to ${
      request.targetLanguage === 'am' ? 'Amharic' : 'Afaan Oromo'
    }.

Important:
- Preserve technical terms (React, API, GitHub, etc.)
- Keep names and numbers unchanged
- Maintain sentence structure and context
- Use natural spoken language, not literal translation
- Preserve punctuation and formatting`;

    const response = await addisClient.post('/api/v1/chat_generate', {
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Translate to ${request.targetLanguage === 'am' ? 'Amharic' : 'Afaan Oromo'}:\n\n${request.text}`,
        },
      ],
      model: request.model || 'Addis-፩-አሌፍ',
      temperature: 0.3,
      maxTokens: 2000,
      language: request.targetLanguage,
    });

    return {
      translatedText: response.data.response_text || '',
      sourceLanguage: request.sourceLanguage || 'en',
      targetLanguage: request.targetLanguage,
    };
  } catch (error: any) {
    console.error('Translation Error:', error.response?.data || error.message);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Text-to-Speech (TTS)
 * Convert Amharic text to audio
 */
export async function textToSpeech(request: TTSRequest): Promise<TTSResponse> {
  try {
    const response = await addisClient.post(
      '/api/v1/voice/generations',
      {
        text: request.text,
        voiceId: request.voiceId,
        language: request.language,
        outputFormat: request.outputFormat || 'mp3',
        speed: request.speed || 1.0,
        clientRequestId: request.clientRequestId || `req-${Date.now()}`,
      },
      {
        responseType: 'arraybuffer',
      }
    );

    return {
      audio: Buffer.from(response.data),
      audioBase64: Buffer.from(response.data).toString('base64'),
      duration: request.text.split(' ').length / 2.5, // Rough estimate
    };
  } catch (error: any) {
    console.error('TTS Error:', error.response?.data || error.message);
    throw new Error(`TTS failed: ${error.message}`);
  }
}

/**
 * Get available Amharic voices
 */
export async function getAmharicVoices() {
  try {
    // Built-in Amharic voices from Addis AI
    return [
      {
        id: 'am-hamen',
        name: 'Hamen',
        gender: 'male',
        language: 'am',
        description: 'Natural male voice',
      },
      {
        id: 'am-abeba',
        name: 'Abeba',
        gender: 'female',
        language: 'am',
        description: 'Natural female voice',
      },
    ];
  } catch (error: any) {
    console.error('Get Voices Error:', error.message);
    return [];
  }
}

/**
 * Estimate TTS cost
 */
export function estimateTTSCost(textLength: number): number {
  // Approximate: $0.015 per 1000 characters
  return (textLength / 1000) * 0.015;
}

/**
 * Estimate STT cost
 */
export function estimateSTTCost(durationSeconds: number): number {
  // Approximate: $0.01 per minute
  return (durationSeconds / 60) * 0.01;
}

/**
 * Estimate Translation cost
 */
export function estimateTranslationCost(textLength: number): number {
  // Approximate: $0.0025 per 1000 characters
  return (textLength / 1000) * 0.0025;
}

export default {
  speechToText,
  translate,
  textToSpeech,
  getAmharicVoices,
  estimateTTSCost,
  estimateSTTCost,
  estimateTranslationCost,
};
