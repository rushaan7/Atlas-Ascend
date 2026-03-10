'use client';

import { useEffect, useState } from 'react';

import type { Country } from '@/lib/types';
import { useGameStore } from '@/lib/store/game-store';
import { formatCountryName, formatRegionLabel } from '@/lib/utils/display';
import { formatSeconds } from '@/lib/utils/formatters';

const modeLabel = (mode: 'continent' | 'marathon' | 'survival'): string => {
  if (mode === 'marathon') {
    return 'Marathon';
  }

  if (mode === 'survival') {
    return 'Survival';
  }

  return 'Continent';
};

const namesForIds = (ids: string[], countries: Country[]): string[] =>
  ids.map((id) => formatCountryName(countries.find((country) => country.id === id)?.name || id));

export const GameCompleteOverlay = () => {
  const [hiddenForSessionId, setHiddenForSessionId] = useState<string | null>(null);

  const session = useGameStore((state) => state.session);
  const countries = useGameStore((state) => state.countries);
  const startGame = useGameStore((state) => state.startGame);
  const clearSession = useGameStore((state) => state.clearSession);

  useEffect(() => {
    if (!session || session.remaining.length > 0) {
      setHiddenForSessionId(null);
    }
  }, [session]);

  if (!session || session.remaining.length > 0) {
    return null;
  }

  if (hiddenForSessionId === session.id) {
    return null;
  }

  const missed = session.missed ?? [];
  const wrongGuesses = session.wrongGuesses ?? [];
  const total = session.completed.length + missed.length;
  const accuracy = total > 0 ? Math.round((session.completed.length / total) * 100) : 0;
  const correctNames = namesForIds(session.completed, countries);
  const missedNames = namesForIds(missed, countries);
  const wrongGuessNames = namesForIds(Array.from(new Set(wrongGuesses)), countries);

  const title =
    session.mode === 'survival' && session.endReason === 'timeout'
      ? "Time's up"
      : 'Session complete';

  return (
    <section className="pointer-events-none fixed inset-0 z-[830] flex items-end justify-end p-4">
      <div className="surface-card pointer-events-auto max-h-[84vh] w-full max-w-lg overflow-auto p-6 sm:p-7">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-accent">{modeLabel(session.mode)}</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">{title}</h3>
          <p className="mt-1 text-sm text-muted">{formatRegionLabel(session.region)}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-ink/12 bg-background/70 p-3 text-center">
            <p className="text-lg font-semibold text-ink">{session.score}</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Score</p>
          </article>
          <article className="rounded-2xl border border-success/25 bg-success/8 p-3 text-center">
            <p className="text-lg font-semibold text-success">{session.completed.length}</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Correct</p>
          </article>
          <article className="rounded-2xl border border-danger/25 bg-danger/8 p-3 text-center">
            <p className="text-lg font-semibold text-danger">{missed.length}</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Missed</p>
          </article>
          <article className="rounded-2xl border border-ink/12 bg-background/70 p-3 text-center">
            <p className="text-lg font-semibold text-ink">{accuracy}%</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Accuracy</p>
          </article>
        </div>

        <div className="mt-4 rounded-2xl border border-ink/12 bg-background/65 p-3 text-sm text-muted">
          <p>Elapsed: {formatSeconds(session.elapsedSeconds)}</p>
          {session.mode === 'survival' && typeof session.timeLimitSeconds === 'number' && (
            <p>Limit: {formatSeconds(session.timeLimitSeconds)}</p>
          )}
          {session.mode === 'survival' && session.endReason && <p>Ended by: {session.endReason}</p>}
        </div>

        {session.mode === 'survival' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-success/26 bg-success/8 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">
                Correct Countries
              </p>
              <p className="mt-1 text-sm text-ink">
                {correctNames.length > 0 ? correctNames.join(', ') : 'None'}
              </p>
            </article>
            <article className="rounded-2xl border border-danger/26 bg-danger/8 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-danger">
                Missed Countries
              </p>
              <p className="mt-1 text-sm text-ink">
                {missedNames.length > 0 ? missedNames.join(', ') : 'None'}
              </p>
            </article>
            <article className="rounded-2xl border border-accent/26 bg-accent/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Wrong Guess Entries
              </p>
              <p className="mt-1 text-sm text-ink">
                {wrongGuessNames.length > 0 ? wrongGuessNames.join(', ') : 'None'}
              </p>
            </article>
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          Country and territory names are now visible on the map with red/green learning highlights.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => setHiddenForSessionId(session.id)}>
            Review On Map
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              startGame({
                mode: session.mode,
                region: session.region,
                order: session.order
              })
            }
          >
            Replay
          </button>
          <button type="button" className="btn-primary" onClick={clearSession}>
            Back To Home
          </button>
        </div>
      </div>
    </section>
  );
};
