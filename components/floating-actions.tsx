'use client';

interface FloatingActionsProps {
  onSkip: () => void;
  onReveal: () => void;
  onRestart: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  isSurvival?: boolean;
}

export const FloatingActions = ({
  onSkip,
  onReveal,
  onRestart,
  onOpenStats,
  onOpenSettings,
  isSurvival = false
}: FloatingActionsProps) => (
  <div className="fixed bottom-4 left-1/2 z-[700] flex w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 items-center gap-2 rounded-full border border-ink/15 bg-surface/85 p-2 shadow-soft backdrop-blur md:bottom-5 md:left-auto md:right-5 md:w-auto md:translate-x-0 md:flex-col md:rounded-3xl">
    {!isSurvival && (
      <button className="fab-button" type="button" onClick={onSkip} aria-label="Skip current country">
        Skip
      </button>
    )}
    {!isSurvival && (
      <button className="fab-button" type="button" onClick={onReveal} aria-label="Reveal current country">
        Reveal
      </button>
    )}
    <button className="fab-button" type="button" onClick={onRestart} aria-label="Restart game">
      Restart
    </button>
    <button className="fab-button" type="button" onClick={onOpenStats} aria-label="Open statistics panel">
      Stats
    </button>
    <button className="fab-button" type="button" onClick={onOpenSettings} aria-label="Open settings panel">
      Settings
    </button>
  </div>
);