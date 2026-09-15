/**
 * Addis AI Client
 * Core wrapper for Addis AI API integration
 */

const ADDIS_API_BASE = 'https://api.addisassistant.com';

function getApiKey(): string {
  const key = process.env.ADDIS_AI_API_KEY;
  if (!key) {
    throw new Error('Missing ADDIS_AI_API_KEY environment variable');
  }
  return key;
}

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
    const audioBuffer = typeof request.audio === 'string' 
      ? Buffer.from(request.audio, 'base64') 
      : request.audio;

    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', blob, 'audio.wav');
    formData.append('language_code', request.language || 'en');

    const res = await fetch(`${ADDIS_API_BASE}/api/v2/stt`, {
      method: 'POST',
      headers: {
        'x-api-key': getApiKey(),
      },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(errData)}`);
    }

    const data: any = await res.json();
    const transcript = data.data?.transcription || data.text || '';

    return {
      text: transcript.trim(),
      confidence: transcript ? 0.95 : 0,
      language: request.language || 'en',
      duration: 5,
    };
  } catch (error: any) {
    console.error('STT Error:', error.message);
    throw new Error(`STT failed: ${error.message}`);
  }
}

/**
 * Translation (English → Amharic/Oromo)
 * Translate transcript using LLM
 */
export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const targetLangName = request.targetLanguage === 'am' ? 'Amharic' : 'Afaan Oromo';
    const prompt = `Translate the following text into natural spoken ${targetLangName}:\n\n${request.text}`;

    const res = await fetch(`${ADDIS_API_BASE}/api/v1/chat_generate`, {
      method: 'POST',
      headers: {
        'x-api-key': getApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(errData)}`);
    }

    const data: any = await res.json();
    const translatedText = data.data?.response_text || data.response_text || '';

    return {
      translatedText,
      sourceLanguage: request.sourceLanguage || 'en',
      targetLanguage: request.targetLanguage,
    };
  } catch (error: any) {
    console.error('Translation Error:', error.message);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Text-to-Speech (TTS)
 * Convert Amharic text to audio
 */
export async function textToSpeech(request: TTSRequest): Promise<TTSResponse> {
  const maxRetries = 4;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const voiceId = request.voiceId === 'am-hamen' ? 'am-simon' : (request.voiceId === 'am-abeba' ? 'am-loza' : request.voiceId);

      const res = await fetch(`${ADDIS_API_BASE}/api/v1/voice/generations`, {
        method: 'POST',
        headers: {
          'x-api-key': getApiKey(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          voice_id: voiceId,
          language: request.language || 'am',
          output_format: request.outputFormat || 'mp3_44100',
          speed: request.speed || 1.0,
          client_request_id: request.clientRequestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      if (res.status === 429 && attempt < maxRetries) {
        console.warn(`[TTS 429 Rate Limit] Concurrency limit hit. Retrying in ${attempt * 1500}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, attempt * 1500));
        continue;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(errData)}`);
      }

      const data: any = await res.json();
      const rawAudio = data.data?.audio || data.audio || data.audio_base64 || '';
      const cleanBase64 = rawAudio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
      const audioBuf = Buffer.from(cleanBase64, 'base64');

      return {
        audio: audioBuf,
        audioBase64: cleanBase64,
        duration: Math.max(2, request.text.split(' ').length / 2.5),
      };
    } catch (error: any) {
      if (attempt >= maxRetries || !error.message.includes('429')) {
        console.error('TTS Error:', error.message);
        throw new Error(`TTS failed: ${error.message}`);
      }
      await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }

  throw new Error('TTS failed after retries');
}

/**
 * Get available Amharic voices
 */
export async function getAmharicVoices() {
  try {
    const res = await fetch(`${ADDIS_API_BASE}/api/v1/voice/voices`, {
      headers: {
        'x-api-key': getApiKey(),
      },
    });

    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data.data)) {
        return data.data;
      }
    }

    // Fallback if network issue
    return [
      {
        id: 'am-simon',
        name: 'Simon',
        gender: 'male',
        language: 'am',
        description: 'Calm storytelling male voice',
      },
      {
        id: 'am-loza',
        name: 'Loza',
        gender: 'female',
        language: 'am',
        description: 'Smooth studio female voice',
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
