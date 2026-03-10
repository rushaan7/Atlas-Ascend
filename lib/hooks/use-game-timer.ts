'use client';

import { useEffect } from 'react';

import { useGameStore } from '@/lib/store/game-store';

export const useGameTimer = (): void => {
  const timerEnabled = useGameStore((state) => state.timerEnabled);
  const session = useGameStore((state) => state.session);
  const tickTimer = useGameStore((state) => state.tickTimer);

  const sessionId = session?.id;
  const remainingCount = session?.remaining.length ?? 0;

  useEffect(() => {
    if (!timerEnabled || !sessionId || remainingCount === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      tickTimer();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerEnabled, sessionId, remainingCount, tickTimer]);
};

