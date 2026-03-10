import { NextRequest } from 'next/server';

import { isRateLimited } from '@/lib/api/rate-limit';
import { fail, ok } from '@/lib/api/response';
import { sessionStore } from '@/lib/api/session-store';
import type { GameSession } from '@/lib/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const OPTIONS = async () => new Response(null, { status: 204, headers: CORS_HEADERS });

const sanitizeSession = (input: GameSession): GameSession => ({
  ...input,
  id: input.id.slice(0, 120),
  mode: input.mode,
  region: input.region.slice(0, 60),
  score: Math.max(0, Number(input.score) || 0),
  streak: Math.max(0, Number(input.streak) || 0),
  completed: input.completed.slice(0, 400),
  remaining: input.remaining.slice(0, 400),
  skipped: input.skipped.slice(0, 400),
  missed: (input.missed || []).slice(0, 400),
  wrongGuesses: (input.wrongGuesses || []).slice(0, 400),
  survivalAttempts: (input.survivalAttempts || []).slice(0, 600),
  elapsedSeconds: Math.max(0, Number(input.elapsedSeconds) || 0),
  timeLimitSeconds:
    typeof input.timeLimitSeconds === 'number' ? Math.max(0, Number(input.timeLimitSeconds)) : undefined,
  endReason: input.endReason
});

export const GET = async (request: NextRequest) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const limiter = isRateLimited(`session:get:${ip}`, 90, 60_000);

  if (limiter.limited) {
    return fail(429, 'RATE_LIMITED', 'Too many requests.');
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const session = sessionStore.get(id);

    if (!session) {
      return fail(404, 'SESSION_NOT_FOUND', 'Session was not found.');
    }

    return ok({ session }, { headers: CORS_HEADERS });
  }

  return ok(
    {
      sessions: Array.from(sessionStore.values()).slice(-100).reverse()
    },
    { headers: CORS_HEADERS }
  );
};

export const POST = async (request: NextRequest) => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const limiter = isRateLimited(`session:post:${ip}`, 60, 60_000);

    if (limiter.limited) {
      return fail(429, 'RATE_LIMITED', 'Too many save attempts.');
    }

    const body = (await request.json()) as { session?: GameSession };
    if (!body.session) {
      return fail(400, 'INVALID_PAYLOAD', 'Request body must include session.');
    }

    const session = sanitizeSession(body.session);
    sessionStore.set(session.id, session);

    return ok(
      {
        session,
        saved: true
      },
      {
        status: 201,
        headers: CORS_HEADERS
      }
    );
  } catch (error) {
    return fail(500, 'SESSION_SAVE_FAILED', 'Unable to save session.', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};