'use client';

import { useEffect } from 'react';

export const useServiceWorker = (): void => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const clearDevServiceWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith('geo-challenge-'))
              .map((key) => caches.delete(key))
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Service worker cleanup failed in development.', error);
      }
    };

    if (process.env.NODE_ENV !== 'production') {
      void clearDevServiceWorkers();
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed.', error);
      }
    };

    void register();
  }, []);
};
