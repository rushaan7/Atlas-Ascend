import type { ApiResponse } from '@/lib/types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { retries?: number; retryDelayMs?: number }
): Promise<T> => {
  const retries = options?.retries ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 250;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const body = (await response.json()) as ApiResponse<T>;

      if (!response.ok || !body.ok || !body.data) {
        throw new ApiError(
          body.error?.message || 'Unexpected API response',
          response.status,
          body.error?.code,
          body.error?.details
        );
      }

      return body.data;
    } catch (error) {
      const isLastAttempt = attempt >= retries;
      if (isLastAttempt) {
        throw error;
      }
      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  throw new ApiError('Retry loop exhausted.', 500);
};
