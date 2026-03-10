'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef } from 'react';

import { FloatingActions } from '@/components/floating-actions';
import { GameHeader } from '@/components/game-header';
import { GuessPanel } from '@/components/guess-panel';
import { MainMenuOverlay } from '@/components/main-menu-overlay';
import { ProgressCard } from '@/components/progress-card';
import { SettingsPanel } from '@/components/settings-panel';
import { SlidePanel } from '@/components/slide-panel';
import { StatsPanel } from '@/components/stats-panel';
import { ToastStack } from '@/components/toast-stack';
import { getCurrentTargetId } from '@/lib/game/engine';
import { useGameTimer } from '@/lib/hooks/use-game-timer';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { useSoundCues } from '@/lib/hooks/use-sound-cues';
import { useGameStore } from '@/lib/store/game-store';

const MapPanel = dynamic(() => import('@/components/map-panel').then((module) => module.MapPanel), {
  ssr: false,
  loading: () => (
    <section className="surface-card h-[460px] p-3 sm:h-[560px]">
      <div className="h-full w-full animate-pulse rounded-2xl border border-ink/10 bg-ink/5" />
    </section>
  )
});

export const GameShell = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const countries = useGameStore((state) => state.countries);
  const continents = useGameStore((state) => state.continents);
  const mode = useGameStore((state) => state.mode);
  const region = useGameStore((state) => state.region);
  const order = useGameStore((state) => state.order);
  const includeTerritories = useGameStore((state) => state.includeTerritories);
  const loading = useGameStore((state) => state.loading);
  const error = useGameStore((state) => state.error);
  const session = useGameStore((state) => state.session);
  const suggestions = useGameStore((state) => state.suggestions);
  const lastResult = useGameStore((state) => state.lastResult);
  const statsPanelOpen = useGameStore((state) => state.statsPanelOpen);
  const settingsPanelOpen = useGameStore((state) => state.settingsPanelOpen);
  const timerEnabled = useGameStore((state) => state.timerEnabled);
  const highContrast = useGameStore((state) => state.highContrast);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const sessionHistory = useGameStore((state) => state.sessionHistory);
  const marathonProgress = useGameStore((state) => state.marathonProgress);

  const loadCountries = useGameStore((state) => state.loadCountries);
  const startGame = useGameStore((state) => state.startGame);
  const submitGuess = useGameStore((state) => state.submitGuess);
  const skipCurrent = useGameStore((state) => state.skipCurrent);
  const revealCurrent = useGameStore((state) => state.revealCurrent);
  const updateSuggestions = useGameStore((state) => state.updateSuggestions);
  const toggleStatsPanel = useGameStore((state) => state.toggleStatsPanel);
  const toggleSettingsPanel = useGameStore((state) => state.toggleSettingsPanel);
  const setMode = useGameStore((state) => state.setMode);
  const setRegion = useGameStore((state) => state.setRegion);
  const setOrder = useGameStore((state) => state.setOrder);
  const setIncludeTerritories = useGameStore((state) => state.setIncludeTerritories);
  const toggleTimer = useGameStore((state) => state.toggleTimer);
  const toggleHighContrast = useGameStore((state) => state.toggleHighContrast);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const resetMarathonProgress = useGameStore((state) => state.resetMarathonProgress);

  useServiceWorker();
  useGameTimer();

  const playCue = useSoundCues();

  useEffect(() => {
    void loadCountries();
  }, [loadCountries]);

  useEffect(() => {
    document.body.classList.toggle('hc-mode', highContrast);
  }, [highContrast]);

  useEffect(() => {
    if (!soundEnabled || !lastResult) {
      return;
    }

    if (lastResult.status === 'correct') {
      playCue('success');
      return;
    }

    if (lastResult.status === 'incorrect') {
      playCue('error');
      return;
    }

    playCue('info');
  }, [lastResult, soundEnabled, playCue]);

  useKeyboardShortcuts({
    onSkip: skipCurrent,
    onReveal: revealCurrent,
    onToggleStats: () => toggleStatsPanel(),
    onToggleSettings: () => toggleSettingsPanel(),
    onRestart: () => startGame(),
    onToggleTimer: toggleTimer,
    onFocusInput: () => inputRef.current?.focus()
  });

  const targetCountry = useMemo(() => {
    if (!session) {
      return undefined;
    }

    const targetId = getCurrentTargetId(session);
    return countries.find((country) => country.id === targetId);
  }, [countries, session]);

  const isBooting = loading && countries.length === 0;
  const isSurvival = mode === 'survival';
  const sessionInProgress = !!session && session.remaining.length > 0;
  const showOutcomeLabels = !!session && !sessionInProgress;

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <GameHeader
        mode={mode}
        region={region}
        order={order}
        includeTerritories={includeTerritories}
        availableRegions={continents}
        loading={loading}
        onModeChange={setMode}
        onRegionChange={setRegion}
        onOrderChange={setOrder}
        onToggleTerritories={(value) => {
          void setIncludeTerritories(value);
        }}
        onStart={() => startGame()}
      />

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className={isBooting ? 'opacity-60' : 'opacity-100 transition-opacity'}>
          <MapPanel
            countries={countries}
            completedIds={session?.completed ?? []}
            missedIds={session?.missed ?? []}
            targetCountry={targetCountry}
            showOutcomeLabels={showOutcomeLabels}
          />
        </div>

        <aside className="grid content-start gap-4">
          <GuessPanel
            ref={inputRef}
            disabled={!sessionInProgress || loading || countries.length === 0}
            isSurvival={isSurvival}
            suggestions={suggestions}
            lastResult={lastResult}
            onSubmitGuess={submitGuess}
            onSuggestionsChange={updateSuggestions}
          />

          <ProgressCard session={session} targetCountry={targetCountry} countries={countries} />
        </aside>
      </div>

      <SlidePanel open={statsPanelOpen} title="Statistics" onClose={() => toggleStatsPanel(false)}>
        <StatsPanel session={session} history={sessionHistory} marathonProgressCount={marathonProgress.length} />
      </SlidePanel>

      <SlidePanel open={settingsPanelOpen} title="Settings" onClose={() => toggleSettingsPanel(false)}>
        <SettingsPanel
          timerEnabled={timerEnabled}
          highContrast={highContrast}
          soundEnabled={soundEnabled}
          onToggleTimer={toggleTimer}
          onToggleContrast={toggleHighContrast}
          onToggleSound={toggleSound}
          onResetMarathon={resetMarathonProgress}
        />
      </SlidePanel>

      {sessionInProgress && (
        <FloatingActions
          onSkip={skipCurrent}
          onReveal={revealCurrent}
          onRestart={() => startGame()}
          onOpenStats={() => toggleStatsPanel(true)}
          onOpenSettings={() => toggleSettingsPanel(true)}
          isSurvival={isSurvival}
        />
      )}

      <MainMenuOverlay />
      <ToastStack />
    </div>
  );
};
