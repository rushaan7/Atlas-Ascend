'use client';

import { completionPercent } from '@/lib/game/engine';
import type { Country, GameSession } from '@/lib/types';
import { useGameStore } from '@/lib/store/game-store';
import { formatCountryName, formatRegionLabel } from '@/lib/utils/display';
import { formatSeconds } from '@/lib/utils/formatters';

interface ProgressCardProps {
  session: GameSession | null;
  targetCountry: Country | undefined;
  countries: Country[];
}

const toName = (id: string, countries: Country[]): string =>
  formatCountryName(countries.find((country) => country.id === id)?.name || id);

export const ProgressCard = ({ session, targetCountry, countries }: ProgressCardProps) => {
  const startGame = useGameStore((state) => state.startGame);
  const clearSession = useGameStore((state) => state.clearSession);

  if (!session) {
    return (
      <section className="surface-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Session</h2>
        <p className="mt-3 text-sm text-muted">Start a game to begin tracking progress, streak, and total score.</p>
      </section>
    );
  }

  const missedIds = session.missed ?? [];
  const wrongGuessIds = session.wrongGuesses ?? [];
  const solved = session.completed.length;
  const total = solved + session.remaining.length + missedIds.length;
  const percent = completionPercent(session);

  const isSurvival = session.mode === 'survival';
  const timeLimit = session.timeLimitSeconds ?? 0;
  const timeLeft = Math.max(0, timeLimit - session.elapsedSeconds);
  const sessionComplete = session.remaining.length === 0;

  return (
    <section className="surface-card p-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Progress</h2>
        <span className="rounded-full border border-accent/30 bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">
          {percent}%
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink/12">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-ink/10 bg-background/70 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">Solved</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {solved} / {total}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-background/70 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">Missed</p>
          <p className="mt-1 text-lg font-semibold text-ink">{missedIds.length}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-background/70 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">Score</p>
          <p className="mt-1 text-lg font-semibold text-ink">{session.score}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-background/70 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{isSurvival ? 'Time Left' : 'Time'}</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatSeconds(isSurvival ? timeLeft : session.elapsedSeconds)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-background/65 p-3 text-sm">
        <p className="text-muted">
          Mode:{' '}
          <span className="font-semibold text-ink">
            {session.mode === 'marathon' ? 'Marathon' : session.mode === 'survival' ? 'Survival' : 'Continent'}
          </span>
        </p>
        <p className="text-muted">
          Region: <span className="font-semibold text-ink">{formatRegionLabel(session.region)}</span>
        </p>
        <p className="mt-2 text-muted">
          Current target:{' '}
          <span className="font-semibold text-ink">{sessionComplete ? 'Round finished' : 'Hidden until guessed'}</span>
        </p>
      </div>

      {isSurvival && sessionComplete && (
        <div className="mt-4 grid gap-3">
          <article className="rounded-2xl border border-danger/30 bg-danger/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-danger">Missed Countries</p>
            {missedIds.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No misses. Clean run.</p>
            ) : (
              <p className="mt-1 text-sm text-ink">{missedIds.map((id) => toName(id, countries)).join(', ')}</p>
            )}
          </article>

          <article className="rounded-2xl border border-success/30 bg-success/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">Correct Countries</p>
            {session.completed.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No successful matches recorded.</p>
            ) : (
              <p className="mt-1 text-sm text-ink">{session.completed.map((id) => toName(id, countries)).join(', ')}</p>
            )}
          </article>

          {wrongGuessIds.length > 0 && (
            <article className="rounded-2xl border border-accent/30 bg-accent/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Wrong Guess Entries</p>
              <p className="mt-1 text-sm text-ink">
                {Array.from(new Set(wrongGuessIds))
                  .map((id) => toName(id, countries))
                  .join(', ')}
              </p>
            </article>
          )}
        </div>
      )}

      {!isSurvival && targetCountry && (
        <p className="mt-4 text-xs text-muted">Target names stay hidden until guessed to keep the challenge fair.</p>
      )}

      {sessionComplete && (
        <div className="mt-5 flex flex-wrap gap-2">
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
      )}
    </section>
  );
};
