'use client';

import type { CountryOrder, GameMode } from '@/lib/types';
import { formatRegionLabel } from '@/lib/utils/display';

interface GameHeaderProps {
  mode: GameMode;
  region: string;
  order: CountryOrder;
  availableRegions: string[];
  loading: boolean;
  includeTerritories: boolean;
  onModeChange: (mode: GameMode) => void;
  onRegionChange: (region: string) => void;
  onOrderChange: (order: CountryOrder) => void;
  onToggleTerritories: (value: boolean) => void;
  onStart: () => void;
}

const SHORTCUTS = ['Ctrl/Cmd + K', 'S Skip', 'R Reveal', 'G Restart', 'A Stats'];

export const GameHeader = ({
  mode,
  region,
  order,
  availableRegions,
  loading,
  includeTerritories,
  onModeChange,
  onRegionChange,
  onOrderChange,
  onToggleTerritories,
  onStart
}: GameHeaderProps) => (
  <header className="surface-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <img
          src="/atlas-ascend-logo.svg"
          alt="Atlas Ascend logo"
          width={44}
          height={44}
          className="h-11 w-11 rounded-xl border border-accent/30 bg-background/75 p-1 shadow-soft"
          loading="eager"
          decoding="async"
        />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Atlas Ascend</h1>
          <p className="mt-1 text-sm text-muted">Minimal, fast, and focused map guessing experience.</p>
        </div>
      </div>
      <span className="rounded-full border border-accent/30 bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        Game Version 1.0
      </span>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))]">
      <label className="field-label">
        Mode
        <select
          className="field-input"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as GameMode)}
          aria-label="Select game mode"
        >
          <option value="continent">Continent Mode</option>
          <option value="marathon">Guess All Marathon</option>
          <option value="survival">Survival Mode</option>
        </select>
      </label>

      <label className="field-label">
        Region
        <select
          className="field-input"
          value={region}
          onChange={(event) => onRegionChange(event.target.value)}
          aria-label="Select region"
        >
          {availableRegions.map((item) => (
            <option key={item} value={item}>
              {formatRegionLabel(item)}
            </option>
          ))}
          {mode !== 'survival' && <option value="All">All Regions</option>}
        </select>
      </label>

      <label className="field-label">
        Sequence
        <select
          className="field-input"
          value={order}
          onChange={(event) => onOrderChange(event.target.value as CountryOrder)}
          aria-label="Select question order"
        >
          <option value="random">Randomized</option>
          <option value="sequential">Top to Bottom</option>
        </select>
      </label>

      <div className="field-label">
        Dataset
        <label className="inline-flex min-h-[42px] items-center justify-between gap-2 rounded-xl border border-ink/15 bg-background/80 px-3 py-2 text-sm text-ink">
          <span>Include territories</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-ink/30 bg-transparent accent-accent"
            checked={includeTerritories}
            onChange={(event) => onToggleTerritories(event.target.checked)}
          />
        </label>
      </div>
    </div>

    {mode === 'survival' && (
      <p className="mt-3 text-xs text-accent">
        Survival rules: one chance per country and mandatory continent timer.
      </p>
    )}

    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button className="btn-primary" type="button" onClick={onStart} disabled={loading}>
        {loading ? 'Loading Countries...' : 'Start Session'}
      </button>

      <div className="flex flex-wrap gap-1.5 text-xs text-muted">
        {SHORTCUTS.map((shortcut) => (
          <span key={shortcut} className="kbd-inline">
            {shortcut}
          </span>
        ))}
      </div>
    </div>
  </header>
);
