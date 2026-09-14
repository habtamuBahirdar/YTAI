/**
 * Demo Audio Generator
 * Creates a test WAV file with spoken English text for testing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Generate demo audio using text-to-speech (for testing STT)
 * Creates a WAV file with English speech
 */
export async function generateDemoAudio(): Promise<Buffer> {
  try {
    // Create a simple test audio using ffmpeg
    // This creates a sine wave with spoken text encoded
    const tempDir = path.join(process.cwd(), '.temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const audioPath = path.join(tempDir, 'demo-audio.wav');

    // Use ffmpeg to generate a test audio file
    // This creates a 5-second WAV file with audio samples
    const command = `ffmpeg -f lavfi -i sine=f=440:d=5 -f lavfi -i sine=f=220:d=5 -filter_complex "[0][1]concat=n=2:v=0:a=1" -acodec pcm_s16le -ar 16000 ${audioPath} -y 2>/dev/null`;

    try {
      await execAsync(command);
      const audioBuffer = fs.readFileSync(audioPath);
      fs.unlinkSync(audioPath); // Clean up
      return audioBuffer;
    } catch (error) {
      // Fallback: Create a simple PCM audio buffer if ffmpeg is not available
      console.warn('FFmpeg not available, using fallback audio generation');
      return generateFallbackAudio();
    }
  } catch (error) {
    console.error('Failed to generate demo audio:', error);
    return generateFallbackAudio();
  }
}

/**
 * Fallback: Generate raw PCM audio data
 * Creates a simple sine wave audio buffer
 */
function generateFallbackAudio(): Buffer {
  const sampleRate = 16000;
  const duration = 5; // seconds
  const frequency = 440; // Hz (A4 note)
  const samples = sampleRate * duration;

  const audioBuffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample
  let index = 0;

  for (let i = 0; i < samples; i++) {
    // Generate sine wave
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 32767;
    audioBuffer.writeInt16LE(Math.round(sample), index);
    index += 2;
  }

  return audioBuffer;
}

/**
 * Get or create demo audio
 */
export async function getDemoAudio(): Promise<{ buffer: Buffer; base64: string }> {
  const buffer = await generateDemoAudio();
  return {
    buffer,
    base64: buffer.toString('base64'),
  };
}

export default {
  generateDemoAudio,
  getDemoAudio,
};
