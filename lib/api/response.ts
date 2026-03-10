import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/lib/types';

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json<ApiResponse<T>>(
    {
      ok: true,
      data
    },
    init
  );

export const fail = (status: number, code: string, message: string, details?: unknown) =>
  NextResponse.json<ApiResponse<never>>(
    {
      ok: false,
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
