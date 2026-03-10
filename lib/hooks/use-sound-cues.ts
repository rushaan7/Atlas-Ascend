'use client';

import { useCallback } from 'react';

type CueType = 'success' | 'error' | 'info';

export const useSoundCues = () => {
  return useCallback((type: CueType) => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    const config =
      type === 'success'
        ? { frequency: 660, duration: 0.12 }
        : type === 'error'
          ? { frequency: 220, duration: 0.18 }
          : { frequency: 420, duration: 0.09 };

    oscillator.frequency.value = config.frequency;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    oscillator.start(now);
    oscillator.stop(now + config.duration);

    oscillator.onended = () => {
      void context.close();
    };
  }, []);
};
