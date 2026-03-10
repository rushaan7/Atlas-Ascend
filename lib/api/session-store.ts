import type { GameSession } from '@/lib/types';

// In-memory session storage for demo/dev deployments.
export const sessionStore = new Map<string, GameSession>();
