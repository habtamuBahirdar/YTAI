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
      baseURL: config.baseUrl || 'https://api.addisai.com',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'AddisDub/1.0',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Addis AI API Error:', error.message);
        throw error;
      }
    );
  }

  /**
   * Speech-to-Text: Convert audio to English transcript
   */
  async speechToText(audioBuffer: Buffer, options?: { language?: string }): Promise<{
    text: string;
    confidence: number;
    duration: number;
  }> {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('audio', audioBuffer, 'audio.wav');
      form.append('language', options?.language || 'en');

      const response = await this.client.post('/v1/stt', form, {
        headers: form.getHeaders(),
      });

      return {
        text: response.data.text,
        confidence: response.data.confidence || 0.95,
        duration: response.data.duration || 0,
      };
    } catch (error) {
      console.error('STT Error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Translation: Translate English text to Amharic
   */
  async translate(text: string, options?: {
    sourceLanguage?: string;
    targetLanguage?: string;
  }): Promise<{
    translatedText: string;
    confidence: number;
  }> {
    try {
      const response = await this.client.post('/v1/translate', {
        text,
        source_language: options?.sourceLanguage || 'en',
        target_language: options?.targetLanguage || 'am',
      });

      return {
        translatedText: response.data.translated_text,
        confidence: response.data.confidence || 0.9,
      };
    } catch (error) {
      console.error('Translation Error:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Text-to-Speech: Convert Amharic text to audio
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
      const response = await this.client.post(
        '/v1/tts',
        {
          text,
          voice: options?.voice || 'am-ET-Neural2-A',
          speed: options?.speed || 1.0,
          pitch: options?.pitch || 0,
          audio_encoding: 'MP3',
        },
        {
          responseType: 'arraybuffer',
        }
      );

      return {
        audioBuffer: Buffer.from(response.data),
        duration: response.headers['x-duration'] || 0,
        format: 'mp3',
      };
    } catch (error) {
      console.error('TTS Error:', error);
      throw new Error('Failed to synthesize speech');
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
    try {
      const response = await this.client.get('/v1/pricing');
      return response.data;
    } catch (error) {
      console.error('Pricing Error:', error);
      return {
        stt: 0.01,
        translation: 0.0025,
        tts: 0.015,
      };
    }
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
