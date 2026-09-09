/**
 * Addis AI Services Layer
 * High-level API for STT, Translation, and TTS operations
 */

import { getAddisAIClient } from './addis-ai-client';
import { trackUsage } from './db-utils';

interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  cost: number;
  duration: number;
}

/**
 * Speech-to-Text Service
 * Converts audio buffer to English transcript
 */
export async function performSTT(
  audioBuffer: Buffer,
  userId: string,
  sessionId: string
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    const client = getAddisAIClient();
    const result = await client.speechToText(audioBuffer);
    
    // Calculate cost (based on duration)
    const durationMinutes = result.duration / 60;
    const cost = durationMinutes * 0.01; // $0.01 per minute
    
    // Track usage
    await trackUsage(
      userId,
      sessionId,
      'STT',
      result.duration,
      cost,
      'addis-ai'
    );

    return {
      success: true,
      data: {
        transcript: result.text,
        confidence: result.confidence,
        duration: result.duration,
      },
      cost,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('STT Service Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'STT processing failed',
      cost: 0,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Translation Service
 * Translates English text to Amharic
 */
export async function performTranslation(
  englishText: string,
  userId: string,
  sessionId: string
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    const client = getAddisAIClient();
    const result = await client.translate(englishText, {
      sourceLanguage: 'en',
      targetLanguage: 'am',
    });

    // Calculate cost (based on character count)
    const charCount = englishText.length;
    const cost = (charCount / 1000) * 0.0025; // $0.0025 per 1000 chars
    
    // Track usage
    await trackUsage(
      userId,
      sessionId,
      'TRANSLATION',
      charCount,
      cost,
      'addis-ai'
    );

    return {
      success: true,
      data: {
        translation: result.translatedText,
        sourceText: englishText,
        confidence: result.confidence,
        charCount,
      },
      cost,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Translation Service Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed',
      cost: 0,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Text-to-Speech Service
 * Converts Amharic text to audio
 */
export async function performTTS(
  amharicText: string,
  userId: string,
  sessionId: string,
  options?: { voice?: string; speed?: number }
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    const client = getAddisAIClient();
    const result = await client.textToSpeech(amharicText, {
      voice: options?.voice || 'am-ET-Neural2-A',
      speed: options?.speed || 1.0,
    });

    // Calculate cost (based on character count)
    const charCount = amharicText.length;
    const cost = (charCount / 1000) * 0.015; // $0.015 per 1000 chars
    
    // Track usage
    await trackUsage(
      userId,
      sessionId,
      'TTS',
      charCount,
      cost,
      'addis-ai'
    );

    return {
      success: true,
      data: {
        audioBuffer: result.audioBuffer,
        duration: result.duration,
        format: result.format,
        text: amharicText,
      },
      cost,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('TTS Service Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'TTS processing failed',
      cost: 0,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Complete Dubbing Pipeline
 * STT → Translation → TTS
 */
export async function processDubbingPipeline(
  audioBuffer: Buffer,
  userId: string,
  sessionId: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<{
  success: boolean;
  transcript?: string;
  translation?: string;
  audioBuffer?: Buffer;
  totalCost: number;
  stages: {
    stt: ProcessingResult;
    translation: ProcessingResult;
    tts: ProcessingResult;
  };
}> {
  const stages = {
    stt: {} as ProcessingResult,
    translation: {} as ProcessingResult,
    tts: {} as ProcessingResult,
  };

  let totalCost = 0;

  try {
    // Stage 1: Speech-to-Text
    onProgress?.('stt', 0);
    stages.stt = await performSTT(audioBuffer, userId, sessionId);
    
    if (!stages.stt.success) {
      throw new Error(stages.stt.error || 'STT failed');
    }

    totalCost += stages.stt.cost;
    onProgress?.('stt', 100);

    // Stage 2: Translation
    onProgress?.('translation', 0);
    stages.translation = await performTranslation(
      stages.stt.data.transcript,
      userId,
      sessionId
    );

    if (!stages.translation.success) {
      throw new Error(stages.translation.error || 'Translation failed');
    }

    totalCost += stages.translation.cost;
    onProgress?.('translation', 100);

    // Stage 3: Text-to-Speech
    onProgress?.('tts', 0);
    stages.tts = await performTTS(
      stages.translation.data.translation,
      userId,
      sessionId
    );

    if (!stages.tts.success) {
      throw new Error(stages.tts.error || 'TTS failed');
    }

    totalCost += stages.tts.cost;
    onProgress?.('tts', 100);

    return {
      success: true,
      transcript: stages.stt.data.transcript,
      translation: stages.translation.data.translation,
      audioBuffer: stages.tts.data.audioBuffer,
      totalCost,
      stages,
    };
  } catch (error) {
    console.error('Dubbing Pipeline Error:', error);
    return {
      success: false,
      totalCost,
      stages,
    };
  }
}

/**
 * Estimate cost for processing
 */
export async function estimateProcessingCost(
  estimatedAudioDurationSeconds: number,
  estimatedTextLength: number
): Promise<{
  stt: number;
  translation: number;
  tts: number;
  total: number;
}> {
  try {
    const client = getAddisAIClient();
    const pricing = await client.getPricing();

    const sttCost = (estimatedAudioDurationSeconds / 60) * pricing.stt;
    const translationCost = (estimatedTextLength / 1000) * pricing.translation;
    const ttsCost = (estimatedTextLength / 1000) * pricing.tts;

    return {
      stt: sttCost,
      translation: translationCost,
      tts: ttsCost,
      total: sttCost + translationCost + ttsCost,
    };
  } catch (error) {
    // Fallback pricing
    const estimatedTranscriptLength = (estimatedAudioDurationSeconds * 2.5) * 4; // rough estimate
    
    return {
      stt: (estimatedAudioDurationSeconds / 60) * 0.01,
      translation: (estimatedTranscriptLength / 1000) * 0.0025,
      tts: (estimatedTranscriptLength / 1000) * 0.015,
      total: (estimatedAudioDurationSeconds / 60) * 0.01 + 
             (estimatedTranscriptLength / 1000) * 0.0025 + 
             (estimatedTranscriptLength / 1000) * 0.015,
    };
  }
}
