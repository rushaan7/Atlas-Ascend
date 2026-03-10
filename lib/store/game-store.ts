'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { fetchJson } from '@/lib/api/http';
import {
  completionPercent,
  createGameSession,
  evaluateGuess,
  exhaustRemainingAsMissed,
  getCurrentTargetId,
  getPoolForMode,
  getSuggestions,
  getSurvivalTimeLimit,
  incrementElapsed,
  markCorrectGuess,
  markIncorrectGuess,
  markSurvivalCorrect,
  markSurvivalMiss,
  skipOrRevealCountry
} from '@/lib/game/engine';
import type { Country, CountryOrder, GameMode, GameSession, GuessResult } from '@/lib/types';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface CountriesPayload {
  countries: Country[];
  continents: string[];
  stats: {
    total: number;
    unMembers: number;
    territories: number;
  };
}

interface GameStore {
  countries: Country[];
  continents: string[];
  mode: GameMode;
  region: string;
  order: CountryOrder;
  includeTerritories: boolean;
  loading: boolean;
  error: string | null;
  session: GameSession | null;
  suggestions: Array<{ id: string; name: string }>;
  lastResult: GuessResult | null;
  statsPanelOpen: boolean;
  settingsPanelOpen: boolean;
  timerEnabled: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  toasts: ToastMessage[];
  sessionHistory: GameSession[];
  marathonProgress: string[];
  loadCountries: () => Promise<void>;
  startGame: (params?: { mode?: GameMode; region?: string; order?: CountryOrder }) => void;
  submitGuess: (value: string) => void;
  skipCurrent: () => void;
  revealCurrent: () => void;
  updateSuggestions: (value: string) => void;
  tickTimer: () => void;
  toggleStatsPanel: (open?: boolean) => void;
  toggleSettingsPanel: (open?: boolean) => void;
  setMode: (mode: GameMode) => void;
  setRegion: (region: string) => void;
  setOrder: (order: CountryOrder) => void;
  setIncludeTerritories: (include: boolean) => Promise<void>;
  toggleTimer: () => void;
  toggleHighContrast: () => void;
  toggleSound: () => void;
  dismissToast: (id: string) => void;
  resetMarathonProgress: () => void;
  clearSession: () => void;
}

const createToast = (type: ToastMessage['type'], text: string): ToastMessage => ({
  id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  text
});

const MAX_TOASTS = 4;

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

const storage = createJSONStorage(() =>
  typeof window === 'undefined' ? memoryStorage : window.localStorage
);

const DEFAULT_SURVIVAL_REGION = 'Europe';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      countries: [],
      continents: [],
      mode: 'continent',
      region: 'Africa',
      order: 'random',
      includeTerritories: true,
      loading: false,
      error: null,
      session: null,
      suggestions: [],
      lastResult: null,
      statsPanelOpen: false,
      settingsPanelOpen: false,
      timerEnabled: false,
      highContrast: false,
      soundEnabled: true,
      toasts: [],
      sessionHistory: [],
      marathonProgress: [],

      loadCountries: async () => {
        const state = get();

        set({ loading: true, error: null });

        try {
          const query = new URLSearchParams({
            includeTerritories: String(state.includeTerritories)
          });

          const payload = await fetchJson<CountriesPayload>(`/api/countries?${query.toString()}`);

          const safeRegion = payload.continents.includes(state.region)
            ? state.region
            : payload.continents[0] || 'Africa';

          set({
            countries: payload.countries,
            continents: payload.continents,
            region: safeRegion,
            loading: false
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to load countries.';
          set({
            loading: false,
            error: message,
            toasts: [createToast('error', 'Country data failed to load. Offline cache will be used when available.')]
          });
        }
      },

      startGame: (params) => {
        const state = get();

        const mode = params?.mode || state.mode;
        const order = params?.order || state.order;
        const requestedRegion = params?.region || state.region;
        const region =
          mode === 'survival' && requestedRegion === 'All'
            ? state.continents.find((item) => item !== 'All') || DEFAULT_SURVIVAL_REGION
            : requestedRegion;

        const pool = getPoolForMode(state.countries, mode, region, state.includeTerritories);
        if (pool.length === 0) {
          set({
            error: 'No countries found for current filters.',
            toasts: [createToast('error', 'No countries available for this selection.')]
          });
          return;
        }

        let session = createGameSession({
          mode,
          region,
          countries: pool,
          order
        });

        if (mode === 'marathon' && state.marathonProgress.length > 0) {
          const persisted = new Set(state.marathonProgress);
          session = {
            ...session,
            completed: session.remaining.filter((id) => persisted.has(id)),
            remaining: session.remaining.filter((id) => !persisted.has(id))
          };
        }

        if (mode === 'survival') {
          const timeLimitSeconds = getSurvivalTimeLimit(region);
          session = {
            ...session,
            timeLimitSeconds
          };
        }

        const survivalNotice =
          mode === 'survival'
            ? `Survival started: one chance per country, ${Math.floor((session.timeLimitSeconds || 0) / 60)} minute timer.`
            : `New ${mode === 'marathon' ? 'marathon' : 'continent'} session started.`;

        set({
          mode,
          region,
          order,
          session,
          timerEnabled: mode === 'survival' ? true : state.timerEnabled,
          suggestions: [],
          lastResult: null,
          error: null,
          toasts: [createToast('info', survivalNotice)]
        });
      },

      submitGuess: (value) => {
        const state = get();
        const session = state.session;

        if (!session) {
          return;
        }

        const targetId = getCurrentTargetId(session);
        if (!targetId) {
          return;
        }

        const targetCountry = state.countries.find((country) => country.id === targetId);
        const result = evaluateGuess(value, targetCountry, state.countries);

        let nextSession = session;
        let toastType: ToastMessage['type'] = 'info';
        let nextResult: GuessResult = result;

        if (session.mode === 'survival') {
          if (result.status === 'correct' && result.expectedCountryId) {
            nextSession = markSurvivalCorrect(session, result.expectedCountryId);
            toastType = 'success';
          } else {
            nextSession = markSurvivalMiss(session, targetId, result.matchedCountryId);
            toastType = 'error';
            nextResult = {
              ...result,
              message: 'Incorrect. Marked missed and moved to the next country.'
            };
          }
        } else if (result.status === 'correct' && result.expectedCountryId) {
          nextSession = markCorrectGuess(session, result.expectedCountryId);
          toastType = 'success';
        } else if (result.status === 'incorrect') {
          nextSession = markIncorrectGuess(session);
          toastType = 'error';
        }

        const done = nextSession.remaining.length === 0;
        if (done) {
          nextSession = {
            ...nextSession,
            endReason: 'completed'
          };
        }

        const history = done ? [nextSession, ...state.sessionHistory].slice(0, 50) : state.sessionHistory;
        const marathonProgress =
          nextSession.mode === 'marathon'
            ? Array.from(new Set([...state.marathonProgress, ...nextSession.completed]))
            : state.marathonProgress;

        const toasts = [createToast(toastType, nextResult.message), ...state.toasts].slice(0, MAX_TOASTS);

        if (done) {
          const doneMessage =
            nextSession.mode === 'survival'
              ? `Survival complete. Correct: ${nextSession.completed.length}, missed: ${nextSession.missed.length}.`
              : `Session complete. ${nextSession.completed.length} countries solved at ${completionPercent(nextSession)}%.`;

          toasts.unshift(createToast('success', doneMessage));
        }

        set({
          session: nextSession,
          suggestions: [],
          lastResult: nextResult,
          sessionHistory: history,
          marathonProgress,
          toasts: toasts.slice(0, MAX_TOASTS)
        });
      },

      skipCurrent: () => {
        const state = get();
        if (!state.session) {
          return;
        }

        if (state.session.mode === 'survival') {
          set({
            toasts: [createToast('info', 'Skip is disabled in survival mode.'), ...state.toasts].slice(0, MAX_TOASTS)
          });
          return;
        }

        const targetId = getCurrentTargetId(state.session);
        if (!targetId) {
          return;
        }

        const nextSession = skipOrRevealCountry(state.session, targetId, 'skip');

        set({
          session: nextSession,
          suggestions: [],
          lastResult: {
            status: 'skip',
            message: 'Target skipped.'
          },
          toasts: [createToast('info', 'Country skipped. Use reveal if you want to see the answer.'), ...state.toasts].slice(
            0,
            MAX_TOASTS
          )
        });
      },

      revealCurrent: () => {
        const state = get();
        if (!state.session) {
          return;
        }

        if (state.session.mode === 'survival') {
          set({
            toasts: [createToast('info', 'Reveal is disabled in survival mode.'), ...state.toasts].slice(0, MAX_TOASTS)
          });
          return;
        }

        const targetId = getCurrentTargetId(state.session);
        if (!targetId) {
          return;
        }

        const targetCountry = state.countries.find((country) => country.id === targetId);
        const nextSession = skipOrRevealCountry(state.session, targetId, 'reveal');

        set({
          session: nextSession,
          suggestions: [],
          lastResult: {
            status: 'reveal',
            message: targetCountry ? `Revealed: ${targetCountry.name}.` : 'Answer revealed.'
          },
          toasts: [
            createToast('info', targetCountry ? `Revealed ${targetCountry.name}.` : 'Answer revealed.'),
            ...state.toasts
          ].slice(0, MAX_TOASTS)
        });
      },

      updateSuggestions: (value) => {
        const state = get();
        if (state.session?.mode === 'survival' || (!state.session && state.mode === 'survival')) {
          set({ suggestions: [] });
          return;
        }

        const countries = state.countries;
        set({ suggestions: getSuggestions(value, countries) });
      },

      tickTimer: () => {
        const state = get();
        if (!state.timerEnabled || !state.session || state.session.remaining.length === 0) {
          return;
        }

        let nextSession = incrementElapsed(state.session);

        if (
          nextSession.mode === 'survival' &&
          typeof nextSession.timeLimitSeconds === 'number' &&
          nextSession.elapsedSeconds >= nextSession.timeLimitSeconds
        ) {
          nextSession = {
            ...exhaustRemainingAsMissed(nextSession),
            endReason: 'timeout'
          };

          set({
            session: nextSession,
            sessionHistory: [nextSession, ...state.sessionHistory].slice(0, 50),
            lastResult: {
              status: 'incorrect',
              message: 'Time is up. Remaining countries were marked as missed.'
            },
            toasts: [
              createToast('error', 'Time is up. Survival ended and remaining countries were marked missed.'),
              ...state.toasts
            ].slice(0, MAX_TOASTS)
          });
          return;
        }

        set({ session: nextSession });
      },

      toggleStatsPanel: (open) => {
        const state = get();
        set({ statsPanelOpen: typeof open === 'boolean' ? open : !state.statsPanelOpen });
      },

      toggleSettingsPanel: (open) => {
        const state = get();
        set({ settingsPanelOpen: typeof open === 'boolean' ? open : !state.settingsPanelOpen });
      },

      setMode: (mode) => set({ mode }),
      setRegion: (region) => set({ region }),
      setOrder: (order) => set({ order }),

      setIncludeTerritories: async (includeTerritories) => {
        set({ includeTerritories });
        await get().loadCountries();
      },

      toggleTimer: () => {
        const state = get();
        if (state.mode === 'survival' || state.session?.mode === 'survival') {
          set({
            toasts: [createToast('info', 'Timer is mandatory in survival mode.'), ...state.toasts].slice(0, MAX_TOASTS)
          });
          return;
        }

        set({ timerEnabled: !state.timerEnabled });
      },

      toggleHighContrast: () => {
        const state = get();
        set({ highContrast: !state.highContrast });
      },

      toggleSound: () => {
        const state = get();
        set({ soundEnabled: !state.soundEnabled });
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id)
        }));
      },

      resetMarathonProgress: () => {
        set({ marathonProgress: [], toasts: [createToast('info', 'Marathon progress reset.')] });
      },

      clearSession: () => {
        set({
          session: null,
          suggestions: [],
          lastResult: null
        });
      }
    }),
    {
      name: 'geographic-challenge-store-v1',
      storage,
      partialize: (state) => ({
        mode: state.mode,
        region: state.region,
        order: state.order,
        includeTerritories: state.includeTerritories,
        timerEnabled: state.timerEnabled,
        highContrast: state.highContrast,
        soundEnabled: state.soundEnabled,
        sessionHistory: state.sessionHistory,
        marathonProgress: state.marathonProgress
      })
    }
  )
);
