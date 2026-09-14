/**
 * Addis AI Segment Processor
 * Handles STT → Translation → TTS pipeline for audio segments
 */

import {
  speechToText,
  translate,
  textToSpeech,
  estimateSTTCost,
  estimateTranslationCost,
  estimateTTSCost,
} from './addis-ai';

export interface SegmentProcessingResult {
  sequence: number;
  sourceText: string;
  translatedText: string;
  audioBase64: string;
  duration: number;
  cost: {
    stt: number;
    translation: number;
    tts: number;
    total: number;
  };
  latency: {
    stt: number;
    translation: number;
    tts: number;
    total: number;
  };
}

export interface SegmentCallbacks {
  onTranscript?: (sequence: number, text: string) => void;
  onTranslation?: (sequence: number, text: string) => void;
  onAudioReady?: (sequence: number, audioBase64: string) => void;
  onProgress?: (stage: string, progress: number) => void;
  onError?: (sequence: number, error: string) => void;
}

/**
 * Process a single audio segment through Addis AI pipeline
 */
export async function processSegmentWithAddisAI(
  sequence: number,
  audioBase64: string,
  voiceId: string = 'am-hamen',
  callbacks?: SegmentCallbacks
): Promise<SegmentProcessingResult> {
  const totalStartTime = Date.now();
  const costs = { stt: 0, translation: 0, tts: 0, total: 0 };
  const latencies = { stt: 0, translation: 0, tts: 0, total: 0 };

  try {
    // Step 1: Speech-to-Text
    console.log(`[Segment ${sequence}] Starting STT...`);
    callbacks?.onProgress?.('stt', 0);

    const sttStartTime = Date.now();

    const sttResult = await speechToText({
      audio: audioBase64,
      language: 'en',
    });

    latencies.stt = Date.now() - sttStartTime;
    costs.stt = estimateSTTCost(5); // Approximate 5 seconds per segment

    console.log(`[Segment ${sequence}] STT completed in ${latencies.stt}ms`);
    console.log(`[Segment ${sequence}] Transcript: "${sttResult.text}"`);

    callbacks?.onTranscript?.(sequence, sttResult.text);
    callbacks?.onProgress?.('stt', 100);

    // Step 2: Translation
    console.log(`[Segment ${sequence}] Starting translation...`);
    callbacks?.onProgress?.('translation', 0);

    const translationStartTime = Date.now();

    const translationResult = await translate({
      text: sttResult.text,
      sourceLanguage: 'en',
      targetLanguage: 'am',
    });

    latencies.translation = Date.now() - translationStartTime;
    costs.translation = estimateTranslationCost(translationResult.translatedText.length);

    console.log(`[Segment ${sequence}] Translation completed in ${latencies.translation}ms`);
    console.log(`[Segment ${sequence}] Translation: "${translationResult.translatedText}"`);

    callbacks?.onTranslation?.(sequence, translationResult.translatedText);
    callbacks?.onProgress?.('translation', 100);

    // Step 3: Text-to-Speech
    console.log(`[Segment ${sequence}] Starting TTS...`);
    callbacks?.onProgress?.('tts', 0);

    const ttsStartTime = Date.now();

    const ttsResult = await textToSpeech({
      text: translationResult.translatedText,
      voiceId,
      language: 'am',
      outputFormat: 'mp3',
      speed: 1.0,
      clientRequestId: `segment-${sequence}-${Date.now()}`,
    });

    latencies.tts = Date.now() - ttsStartTime;
    costs.tts = estimateTTSCost(translationResult.translatedText.length);

    console.log(`[Segment ${sequence}] TTS completed in ${latencies.tts}ms`);

    callbacks?.onAudioReady?.(sequence, ttsResult.audioBase64 || '');
    callbacks?.onProgress?.('tts', 100);

    latencies.total = Date.now() - totalStartTime;
    costs.total = costs.stt + costs.translation + costs.tts;

    console.log(`[Segment ${sequence}] Total pipeline latency: ${latencies.total}ms`);
    console.log(`[Segment ${sequence}] Total cost: $${costs.total.toFixed(6)}`);

    return {
      sequence,
      sourceText: sttResult.text,
      translatedText: translationResult.translatedText,
      audioBase64: ttsResult.audioBase64 || '',
      duration: ttsResult.duration || 5,
      cost: costs,
      latency: latencies,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Segment ${sequence}] Processing failed:`, errorMessage);
    callbacks?.onError?.(sequence, errorMessage);
    throw error;
  }
}

export default {
  processSegmentWithAddisAI,
};
