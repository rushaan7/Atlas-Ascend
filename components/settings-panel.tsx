'use client';

interface SettingsPanelProps {
  timerEnabled: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  onToggleTimer: () => void;
  onToggleContrast: () => void;
  onToggleSound: () => void;
  onResetMarathon: () => void;
}

const SettingRow = ({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <label className="flex items-start justify-between gap-3 rounded-xl border border-ink/12 bg-background/70 p-3">
    <span>
      <span className="block text-sm font-semibold text-ink">{label}</span>
      <span className="block text-xs text-muted">{description}</span>
    </span>
    <input type="checkbox" className="mt-1 h-4 w-4 accent-accent" checked={checked} onChange={onChange} />
  </label>
);

export const SettingsPanel = ({
  timerEnabled,
  highContrast,
  soundEnabled,
  onToggleTimer,
  onToggleContrast,
  onToggleSound,
  onResetMarathon
}: SettingsPanelProps) => (
  <div className="space-y-3">
    <SettingRow
      label="Session Timer"
      description="Track elapsed time and show it in the progress card."
      checked={timerEnabled}
      onChange={onToggleTimer}
    />
    <SettingRow
      label="High Contrast"
      description="Increase contrast for accessibility while staying in dark mode."
      checked={highContrast}
      onChange={onToggleContrast}
    />
    <SettingRow
      label="Sound Cues"
      description="Play lightweight tone feedback for guesses."
      checked={soundEnabled}
      onChange={onToggleSound}
    />

    <button type="button" className="btn-ghost border-danger/40 text-danger hover:border-danger/60" onClick={onResetMarathon}>
      Reset Marathon Progress
    </button>
  </div>
);