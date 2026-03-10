'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

import { useGameStore } from '@/lib/store/game-store';

export const ToastStack = () => {
  const toasts = useGameStore((state) => state.toasts);
  const dismissToast = useGameStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismissToast(toast.id);
      }, 3200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts, dismissToast]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[810] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={clsx(
            'pointer-events-auto animate-slide-in rounded-2xl border px-4 py-3 text-sm shadow-soft backdrop-blur',
            {
              'border-success/35 bg-success/16 text-success': toast.type === 'success',
              'border-danger/35 bg-danger/16 text-danger': toast.type === 'error',
              'border-accent/35 bg-surface/92 text-ink': toast.type === 'info'
            }
          )}
          role="status"
        >
          <p>{toast.text}</p>
        </article>
      ))}
    </div>
  );
};