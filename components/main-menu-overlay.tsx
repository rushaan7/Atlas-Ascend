'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useMemo } from 'react';

import { getSurvivalTimeLimit } from '@/lib/game/engine';
import { useGameStore } from '@/lib/store/game-store';
import { formatRegionLabel } from '@/lib/utils/display';

const CONTINENT_TAGS: Record<string, string> = {
  Africa: 'AF',
  Antarctica: 'AN',
  Asia: 'AS',
  Europe: 'EU',
  'North America': 'NA',
  Oceania: 'OC',
  'South America': 'SA'
};

const DEFAULT_CONTINENTS = [
  'Africa',
  'Antarctica',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America'
];

const minutesLabel = (seconds: number): string => `${Math.round(seconds / 60)} min`;

export const MainMenuOverlay = () => {
  const session = useGameStore((state) => state.session);
  const countries = useGameStore((state) => state.countries);
  const continents = useGameStore((state) => state.continents);
  const includeTerritories = useGameStore((state) => state.includeTerritories);
  const history = useGameStore((state) => state.sessionHistory);
  const startGame = useGameStore((state) => state.startGame);

  const { totalCorrect, totalSessions, bestMarathonScore } = useMemo(() => {
    const totalCorrect = history.reduce((count, game) => count + game.completed.length, 0);
    const totalSessions = history.length;
    const bestMarathonScore = history
      .filter((game) => game.mode === 'marathon')
      .reduce((best, game) => (game.score > best ? game.score : best), 0);

    return {
      totalCorrect,
      totalSessions,
      bestMarathonScore
    };
  }, [history]);

  const availableContinents = useMemo(
    () => (continents.length > 0 ? continents.filter((item) => item !== 'All') : DEFAULT_CONTINENTS),
    [continents]
  );

  const countryCountByContinent = useMemo(() => {
    const counts = new Map<string, number>();
    const allowed = new Set(availableContinents);
    for (const continent of availableContinents) {
      counts.set(continent, 0);
    }

    for (const country of countries) {
      if (!allowed.has(country.continent)) {
        continue;
      }

      if (!includeTerritories && country.territory) {
        continue;
      }

      counts.set(country.continent, (counts.get(country.continent) || 0) + 1);
    }

    return counts;
  }, [availableContinents, countries, includeTerritories]);

  if (session) {
    return null;
  }

  const cardHover = { y: -3, scale: 1.01 };
  const cardTap = { scale: 0.995 };
  const cardTransition = { type: 'spring' as const, stiffness: 290, damping: 24, mass: 0.52 };

  return (
    <LazyMotion features={domAnimation}>
      <m.section
        className="fixed inset-0 z-[820] flex items-center justify-center bg-background/88 p-4 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <m.div
          className="surface-card max-h-[92vh] w-full max-w-4xl overflow-auto p-6 sm:p-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <header className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-accent/12 text-sm font-bold text-accent">
              AA
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">Atlas Ascend</h2>
            <p className="mt-1 text-sm text-muted">Choose a mode and start your run.</p>
          </header>

          <div className="mt-5 grid gap-3 rounded-2xl border border-ink/10 bg-background/65 p-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-lg font-semibold text-ink">{totalCorrect}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Total Correct</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-ink">{totalSessions}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Sessions Played</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-ink">{bestMarathonScore.toLocaleString()}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Best Marathon</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <m.button
              type="button"
              className="surface-card text-left transition-[transform,border-color,background-color,box-shadow] duration-200 will-change-transform hover:border-accent/40 hover:bg-accent/8"
              onClick={() => startGame({ mode: 'marathon', region: 'All', order: 'random' })}
              whileHover={cardHover}
              whileTap={cardTap}
              transition={cardTransition}
            >
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-accent">Marathon</p>
                <p className="mt-1 text-lg font-semibold text-ink">Guess All Countries</p>
                <p className="mt-1 text-sm text-muted">
                  Full world run, persistent progress, score-focused.
                </p>
              </div>
            </m.button>

            <m.div
              className="surface-card p-5 transition-[transform,border-color,background-color,box-shadow] duration-200 will-change-transform hover:border-danger/30 hover:bg-danger/5"
              whileHover={cardHover}
              transition={cardTransition}
            >
              <p className="text-xs uppercase tracking-[0.12em] text-danger">Survival</p>
              <p className="mt-1 text-lg font-semibold text-ink">One-Chance Timed Mode</p>
              <p className="mt-1 text-sm text-muted">
                One wrong guess per country. Misses are permanent.
              </p>
              <p className="mt-2 text-[11px] text-muted">
                Timer is auto-enabled. Choose a continent below.
              </p>
            </m.div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Continent Learning (Top-to-Bottom Sequence)
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableContinents.map((continent) => (
                <m.button
                  key={`learning-${continent}`}
                  type="button"
                  className="rounded-2xl border border-ink/12 bg-background/70 p-3 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 will-change-transform hover:border-accent/45 hover:bg-surface hover:shadow-soft"
                  onClick={() => startGame({ mode: 'continent', region: continent, order: 'sequential' })}
                  whileHover={cardHover}
                  whileTap={cardTap}
                  transition={cardTransition}
                >
                  <p className="text-xs font-semibold text-accent">{CONTINENT_TAGS[continent] || 'GL'}</p>
                  <p className="mt-1 font-semibold text-ink">{formatRegionLabel(continent)}</p>
                  <p className="text-xs text-muted">{countryCountByContinent.get(continent) || 0} countries</p>
                </m.button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Survival by Continent
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableContinents.map((continent) => (
                <m.button
                  key={`survival-${continent}`}
                  type="button"
                  className="rounded-2xl border border-danger/24 bg-danger/6 p-3 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 will-change-transform hover:border-danger/55 hover:bg-danger/10 hover:shadow-soft"
                  onClick={() => startGame({ mode: 'survival', region: continent, order: 'sequential' })}
                  whileHover={cardHover}
                  whileTap={cardTap}
                  transition={cardTransition}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{formatRegionLabel(continent)}</p>
                    <span className="rounded-full border border-danger/30 bg-danger/12 px-2 py-0.5 text-[10px] font-semibold text-danger">
                      {minutesLabel(getSurvivalTimeLimit(continent))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">1 chance per country</p>
                </m.button>
              ))}
            </div>
          </div>
        </m.div>
      </m.section>
    </LazyMotion>
  );
};
