'use client';

import { completionPercent } from '@/lib/game/engine';
import type { GameSession } from '@/lib/types';
import { formatRegionLabel } from '@/lib/utils/display';
import { formatSeconds } from '@/lib/utils/formatters';

interface StatsPanelProps {
  session: GameSession | null;
  history: GameSession[];
  marathonProgressCount: number;
}

export const StatsPanel = ({ session, history, marathonProgressCount }: StatsPanelProps) => {
  const recent = history.slice(0, 5);
  const missedCount = session?.missed?.length ?? 0;

  return (
    <div className="space-y-4 text-sm text-ink">
      <article className="rounded-2xl border border-ink/12 bg-background/70 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Active Session</h4>
        {session ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted">Mode</dt>
              <dd className="font-semibold">
                {session.mode === 'marathon' ? 'Marathon' : session.mode === 'survival' ? 'Survival' : 'Continent'}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Region</dt>
              <dd className="font-semibold">{formatRegionLabel(session.region)}</dd>
            </div>
            <div>
              <dt className="text-muted">Score</dt>
              <dd className="font-semibold">{session.score}</dd>
            </div>
            <div>
              <dt className="text-muted">Completion</dt>
              <dd className="font-semibold">{completionPercent(session)}%</dd>
            </div>
            <div>
              <dt className="text-muted">Elapsed</dt>
              <dd className="font-semibold">{formatSeconds(session.elapsedSeconds)}</dd>
            </div>
            <div>
              <dt className="text-muted">Missed</dt>
              <dd className="font-semibold">{missedCount}</dd>
            </div>
            {session.mode === 'survival' && (
              <>
                <div>
                  <dt className="text-muted">Timer</dt>
                  <dd className="font-semibold">
                    {formatSeconds(Math.max(0, (session.timeLimitSeconds || 0) - session.elapsedSeconds))}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">End</dt>
                  <dd className="font-semibold">{session.endReason || 'in progress'}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-muted">Marathon Saved</dt>
              <dd className="font-semibold">{marathonProgressCount}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-muted">No active session.</p>
        )}
      </article>

      <article className="rounded-2xl border border-ink/12 bg-background/70 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Recent Sessions</h4>
        {recent.length === 0 ? (
          <p className="mt-2 text-muted">Play a round to see history.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((item) => (
              <li key={item.id} className="rounded-xl border border-ink/10 bg-surface/85 px-3 py-2">
                <p className="font-semibold text-ink">
                  {item.mode === 'marathon' ? 'Marathon' : item.mode === 'survival' ? 'Survival' : 'Continent'} |{' '}
                  {formatRegionLabel(item.region)}
                </p>
                <p className="text-xs text-muted">
                  Score {item.score} | Completed {item.completed.length} | Missed {(item.missed ?? []).length}
                </p>
                <p className="text-xs text-muted">{new Date(item.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
};