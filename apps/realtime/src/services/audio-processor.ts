/**
 * Audio Processing Pipeline Service
 * Orchestrates STT → Translation → TTS workflow
 */

import {
  speechToText,
  translate,
  textToSpeech,
  getAmharicVoices,
  estimateTTSCost,
  estimateSTTCost,
  estimateTranslationCost,
} from './addis-ai';

export interface AudioSegment {
  sequence: number;
  audioBuffer: Buffer;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ProcessedSegment {
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

/**
 * Process a single audio segment through the full pipeline
 */
export async function processAudioSegment(
  segment: AudioSegment,
  voiceId: string = 'am-hamen'
): Promise<ProcessedSegment> {
  const totalStartTime = Date.now();
  const costs = { stt: 0, translation: 0, tts: 0, total: 0 };
  const latencies = { stt: 0, translation: 0, tts: 0, total: 0 };

  try {
    // Step 1: Speech-to-Text
    console.log(`[Segment ${segment.sequence}] Starting STT...`);
    const sttStartTime = Date.now();
    const audioBase64 = segment.audioBuffer.toString('base64');
    
    const sttResult = await speechToText({
      audio: audioBase64,
      language: 'en',
    });
    
    latencies.stt = Date.now() - sttStartTime;
    costs.stt = estimateSTTCost(segment.duration);
    
    console.log(`[Segment ${segment.sequence}] STT completed in ${latencies.stt}ms`);
    console.log(`[Segment ${segment.sequence}] Transcript: "${sttResult.text}"`);

    // Step 2: Translation
    console.log(`[Segment ${segment.sequence}] Starting translation...`);
    const translationStartTime = Date.now();
    
    const translationResult = await translate({
      text: sttResult.text,
      sourceLanguage: 'en',
      targetLanguage: 'am',
    });
    
    latencies.translation = Date.now() - translationStartTime;
    costs.translation = estimateTranslationCost(translationResult.translatedText.length);
    
    console.log(`[Segment ${segment.sequence}] Translation completed in ${latencies.translation}ms`);
    console.log(`[Segment ${segment.sequence}] Translation: "${translationResult.translatedText}"`);

    // Step 3: Text-to-Speech
    console.log(`[Segment ${segment.sequence}] Starting TTS...`);
    const ttsStartTime = Date.now();
    
    const ttsResult = await textToSpeech({
      text: translationResult.translatedText,
      voiceId,
      language: 'am',
      outputFormat: 'mp3',
      speed: 1.0,
      clientRequestId: `segment-${segment.sequence}-${Date.now()}`,
    });
    
    latencies.tts = Date.now() - ttsStartTime;
    costs.tts = estimateTTSCost(translationResult.translatedText.length);
    
    console.log(`[Segment ${segment.sequence}] TTS completed in ${latencies.tts}ms`);

    latencies.total = Date.now() - totalStartTime;
    costs.total = costs.stt + costs.translation + costs.tts;

    return {
      sequence: segment.sequence,
      sourceText: sttResult.text,
      translatedText: translationResult.translatedText,
      audioBase64: ttsResult.audioBase64 || '',
      duration: ttsResult.duration || segment.duration,
      cost: costs,
      latency: latencies,
    };
  } catch (error) {
    console.error(`[Segment ${segment.sequence}] Processing failed:`, error);
    throw error;
  }
}

/**
 * Process multiple segments in sequence
 */
export async function processAudioSegments(
  segments: AudioSegment[],
  voiceId?: string
): Promise<ProcessedSegment[]> {
  const results: ProcessedSegment[] = [];

  for (const segment of segments) {
    try {
      const result = await processAudioSegment(segment, voiceId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process segment ${segment.sequence}:`, error);
      // Continue with next segment instead of failing completely
    }
  }

  return results;
}

/**
 * Get available voices
 */
export async function getVoices() {
  return getAmharicVoices();
}

/**
 * Estimate total cost for audio duration
 */
export function estimateTotalCost(durationSeconds: number): number {
  const sttCost = estimateSTTCost(durationSeconds);
  
  // Estimate transcript length: ~2.5 words per second, ~5 chars per word = ~12.5 chars per second
  const estimatedChars = durationSeconds * 12.5;
  const translationCost = estimateTranslationCost(estimatedChars);
  const ttsCost = estimateTTSCost(estimatedChars);
  
  return sttCost + translationCost + ttsCost;
}

export default {
  processAudioSegment,
  processAudioSegments,
  getVoices,
  estimateTotalCost,
};
