import { NextRequest } from 'next/server';

import { fail, ok } from '@/lib/api/response';
import { sessionStore } from '@/lib/api/session-store';

export const GET = async (_request: NextRequest, context: { params: { id: string } }) => {
  const session = sessionStore.get(context.params.id);

  if (!session) {
    return fail(404, 'SESSION_NOT_FOUND', 'Session was not found.');
  }

  return ok({ session });
};

export const DELETE = async (_request: NextRequest, context: { params: { id: string } }) => {
  const existed = sessionStore.delete(context.params.id);

  if (!existed) {
    return fail(404, 'SESSION_NOT_FOUND', 'Session was not found.');
  }

  return ok({ deleted: true });
};
