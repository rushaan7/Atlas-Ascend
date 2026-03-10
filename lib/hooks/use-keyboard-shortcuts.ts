'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onSkip: () => void;
  onReveal: () => void;
  onToggleStats: () => void;
  onToggleSettings: () => void;
  onRestart: () => void;
  onFocusInput: () => void;
  onToggleTimer: () => void;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        options.onFocusInput();
        return;
      }

      if (isInput) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          options.onSkip();
          break;
        case 'r':
          event.preventDefault();
          options.onReveal();
          break;
        case 'g':
          event.preventDefault();
          options.onRestart();
          break;
        case 't':
          event.preventDefault();
          options.onToggleTimer();
          break;
        case 'a':
          event.preventDefault();
          options.onToggleStats();
          break;
        case 'o':
          event.preventDefault();
          options.onToggleSettings();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [options]);
};
