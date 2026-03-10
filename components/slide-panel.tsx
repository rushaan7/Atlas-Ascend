'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface SlidePanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const SlidePanel = ({ open, title, onClose, children }: SlidePanelProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div
      className={clsx('fixed inset-0 z-[750] transition', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close panel"
        className={clsx('absolute inset-0 bg-black/55 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />

      <aside
        className={clsx(
          'absolute right-0 top-0 h-full w-full max-w-md border-l border-ink/15 bg-surface/96 p-6 shadow-soft backdrop-blur',
          'transition-transform duration-300',
          open ? 'translate-x-0 animate-panel-in' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button type="button" className="btn-ghost px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">{children}</div>
      </aside>
    </div>
  );
};