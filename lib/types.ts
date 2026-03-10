import type { Feature, Geometry } from 'geojson';

export type GameMode = 'continent' | 'marathon' | 'survival';

export type CountryOrder = 'random' | 'sequential';

export interface Country {
  id: string;
  name: string;
  nativeName: string;
  continent: string;
  subregion: string;
  coordinates: Feature<Geometry>;
  territory: boolean;
  unMember: boolean;
  aliases: string[];
  centroid: [number, number];
}

export interface SurvivalAttempt {
  targetId: string;
  guessId?: string;
  correct: boolean;
}

export interface GameSession {
  id: string;
  mode: GameMode;
  region: string;
  score: number;
  streak: number;
  completed: string[];
  remaining: string[];
  skipped: string[];
  missed: string[];
  wrongGuesses: string[];
  survivalAttempts: SurvivalAttempt[];
  timestamp: string;
  elapsedSeconds: number;
  order: CountryOrder;
  timeLimitSeconds?: number;
  endReason?: 'completed' | 'timeout';
}

export interface GuessResult {
  status: 'correct' | 'incorrect' | 'duplicate' | 'skip' | 'reveal';
  message: string;
  expectedCountryId?: string;
  matchedCountryId?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CountryFilters {
  continent?: string;
  includeTerritories?: boolean;
}