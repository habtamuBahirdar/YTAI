/**
 * Addis AI Client Configuration
 * Handles all communication with Addis AI API
 */

import axios, { AxiosInstance } from 'axios';

interface AddisAIConfig {
  apiKey: string;
  baseUrl?: string;
}

class AddisAIClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: AddisAIConfig) {
    this.apiKey = config.apiKey;
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.addisassistant.com',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'AddisDub/1.0',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Addis AI API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Speech-to-Text: Convert audio buffer to transcript using Addis AI
   */
  async speechToText(audioBuffer: Buffer, options?: { language?: string }): Promise<{
    text: string;
    confidence: number;
    duration: number;
  }> {
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', blob, 'audio.wav');
      formData.append('language_code', options?.language || 'en');

      const response = await fetch('https://api.addisassistant.com/api/v2/stt', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errData)}`);
      }

      const data: any = await response.json();
      return {
        text: data.data?.transcription || data.text || '',
        confidence: 0.95,
        duration: 5,
      };
    } catch (error: any) {
      console.error('STT Error:', error.message);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Translation: Translate English text to Amharic using Addis AI LLM
   */
  async translate(text: string, options?: {
    sourceLanguage?: string;
    targetLanguage?: string;
  }): Promise<{
    translatedText: string;
    confidence: number;
  }> {
    try {
      const targetLang = options?.targetLanguage || 'am';
      const targetLangName = targetLang === 'am' ? 'Amharic' : 'Afaan Oromo';
      const prompt = `Translate the following text into natural spoken ${targetLangName}:\n\n${text}`;

      const response = await this.client.post('/api/v1/chat_generate', {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return {
        translatedText: response.data.data?.response_text || response.data.response_text || '',
        confidence: 0.9,
      };
    } catch (error: any) {
      console.error('Translation Error:', error.response?.data || error.message);
      throw new Error(`Failed to translate text: ${error.message}`);
    }
  }

  /**
   * Text-to-Speech: Convert Amharic text to audio using Addis AI TTS
   */
  async textToSpeech(text: string, options?: {
    voice?: string;
    speed?: number;
    pitch?: number;
  }): Promise<{
    audioBuffer: Buffer;
    duration: number;
    format: string;
  }> {
    try {
      let voiceId = options?.voice || 'am-simon';
      if (voiceId === 'am-hamen') voiceId = 'am-simon';
      if (voiceId === 'am-abeba') voiceId = 'am-loza';

      const response = await this.client.post(
        '/api/v1/voice/generations',
        {
          text,
          voice_id: voiceId,
          language: 'am',
          output_format: 'mp3_44100',
          speed: options?.speed || 1.0,
          client_request_id: `web-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        }
      );

      const data = response.data;
      const rawAudio = data.data?.audio || data.audio || data.audio_base64 || '';
      const cleanBase64 = rawAudio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const estimatedDuration = Math.max(2, text.split(' ').length / 2.5);

      return {
        audioBuffer: buffer,
        duration: estimatedDuration,
        format: 'mp3',
      };
    } catch (error: any) {
      console.error('TTS Error:', error.response?.data || error.message);
      throw new Error(`Failed to synthesize speech: ${error.message}`);
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<{
    stt: number; // per minute
    translation: number; // per 1000 chars
    tts: number; // per 1000 chars
  }> {
    return {
      stt: 0.01,
      translation: 0.0025,
      tts: 0.015,
    };
  }
}

// Singleton instance
let addisAIClient: AddisAIClient | null = null;

export function initializeAddisAI(config: AddisAIConfig): AddisAIClient {
  addisAIClient = new AddisAIClient(config);
  return addisAIClient;
}

export function getAddisAIClient(): AddisAIClient {
  if (!addisAIClient) {
    const apiKey = process.env.ADDIS_AI_API_KEY;
    if (!apiKey) {
      throw new Error('ADDIS_AI_API_KEY not configured');
    }
    addisAIClient = new AddisAIClient({ apiKey });
  }
  return addisAIClient;
}

export default AddisAIClient;
