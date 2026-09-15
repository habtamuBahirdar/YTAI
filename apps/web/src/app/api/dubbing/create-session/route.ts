import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeUrl, parseYouTubeUrl } from '@/lib/youtube-utils';
import { canProcessYouTubeVideo } from '@/lib/youtube-service';
import { createDubbingSession } from '@/lib/db-utils';
import { z } from 'zod';

const createSessionSchema = z.object({
  youtubeUrl: z.string().url(),
  videoId: z.string().length(11),
  title: z.string(),
});

/**
 * POST /api/dubbing/create-session
 * Create a new dubbing session for a YouTube video
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtubeUrl, videoId, title } = await createSessionSchema.parseAsync(body);

    // Validate YouTube URL
    if (!validateYouTubeUrl(youtubeUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Parse and verify video
    const parsed = parseYouTubeUrl(youtubeUrl);
    if (!parsed || parsed.videoId !== videoId) {
      return NextResponse.json(
        { error: 'Video ID mismatch' },
        { status: 400 }
      );
    }

    // Check if video can be processed
    const { canProcess, reason } = await canProcessYouTubeVideo(videoId);
    if (!canProcess) {
      return NextResponse.json(
        { error: reason || 'Video cannot be processed' },
        { status: 400 }
      );
    }

    // Get user ID from session (placeholder)
    const userId = 'demo-user-1'; // TODO: Get from auth session

    // Create session in database
    try {
      const session = await createDubbingSession(userId, youtubeUrl, videoId, title);

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        status: 'pending',
      });
    } catch (dbError) {
      console.warn('Database unavailable, using dev fallback session ID:', dbError);
      const fallbackSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return NextResponse.json({
        success: true,
        sessionId: fallbackSessionId,
        status: 'pending',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]?.message || 'Validation error';
      return NextResponse.json(
        { error: firstIssue },
        { status: 400 }
      );
    }

    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

