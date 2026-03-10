'use client';

import { forwardRef, useMemo, useState } from 'react';
import clsx from 'clsx';

import type { GuessResult } from '@/lib/types';
import { formatCountryName } from '@/lib/utils/display';

interface GuessPanelProps {
  disabled: boolean;
  isSurvival?: boolean;
  suggestions: Array<{ id: string; name: string }>;
  lastResult: GuessResult | null;
  onSubmitGuess: (value: string) => void;
  onSuggestionsChange: (value: string) => void;
}

const feedbackTone = (result: GuessResult | null): string => {
  if (!result) {
    return 'text-muted';
  }

  if (result.status === 'correct') {
    return 'text-success';
  }

  if (result.status === 'incorrect') {
    return 'text-danger';
  }

  return 'text-accent';
};

export const GuessPanel = forwardRef<HTMLInputElement, GuessPanelProps>(
  ({ disabled, isSurvival = false, suggestions, lastResult, onSubmitGuess, onSuggestionsChange }, inputRef) => {
    const [value, setValue] = useState('');

    const helperText = useMemo(() => {
      if (!lastResult) {
        return isSurvival
          ? 'Survival: one guess only per country. Wrong answers are locked in.'
          : 'Type a country or territory name. Fuzzy matching and aliases are enabled.';
      }
      return lastResult.message;
    }, [isSurvival, lastResult]);

    const submit = () => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      onSubmitGuess(trimmed);
      setValue('');
      onSuggestionsChange('');
    };

    return (
      <section className="surface-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Guess Input</h2>
          <span className="kbd-inline">Enter to submit</span>
        </div>

        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                const next = event.target.value;
                setValue(next);
                onSuggestionsChange(isSurvival ? '' : next);
              }}
              placeholder={isSurvival ? 'One chance: enter country name' : 'Enter country name'}
              className="field-input flex-1"
              autoComplete="off"
              disabled={disabled}
              aria-label="Guess country"
            />
            <button type="submit" className="btn-primary min-w-28" disabled={disabled || value.trim().length === 0}>
              Submit
            </button>
          </div>
        </form>

        {!isSurvival && suggestions.length > 0 && (
          <div className="mt-3 rounded-2xl border border-ink/12 bg-background/60 p-2">
            <p className="px-2 py-1 text-xs uppercase tracking-[0.12em] text-muted">Suggestions</p>
            <ul className="grid gap-2 sm:grid-cols-2" aria-label="Autocorrect suggestions">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-ink/15 bg-surface/70 px-3 py-2 text-left text-sm text-ink transition hover:border-accent/45 hover:text-accent"
                    onClick={() => {
                      setValue(formatCountryName(suggestion.name));
                      onSuggestionsChange('');
                    }}
                  >
                    {formatCountryName(suggestion.name)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className={clsx('mt-4 text-sm', feedbackTone(lastResult))}>{helperText}</p>
      </section>
    );
  }
);

GuessPanel.displayName = 'GuessPanel';
