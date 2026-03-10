import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import 'leaflet/dist/leaflet.css';

import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-main' });

export const metadata: Metadata = {
  title: {
    default: 'Atlas Ascend | Interactive World Map Guessing Game',
    template: '%s | Atlas Ascend'
  },
  description:
    'Play continent runs, marathon mode, and survival mode in a polished interactive world map quiz for countries and territories.',
  keywords: [
    'geography game',
    'map quiz',
    'country guessing game',
    'territory quiz',
    'world map game',
    'atlas ascend'
  ],
  applicationName: 'Atlas Ascend',
  manifest: '/manifest.webmanifest',
  category: 'games',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: 'website',
    title: 'Atlas Ascend',
    description:
      'Interactive world map quiz with continent, marathon, and survival modes for country and territory guessing.',
    siteName: 'Atlas Ascend'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas Ascend',
    description:
      'Interactive world map quiz with continent, marathon, and survival modes for country and territory guessing.'
  }
};

export const viewport: Viewport = {
  themeColor: '#0b1020'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Atlas Ascend',
    applicationCategory: 'GameApplication',
    genre: ['Trivia', 'Educational'],
    operatingSystem: 'Web Browser',
    description:
      'Interactive world map quiz with continent, marathon, and survival modes for country and territory guessing.'
  };

  const devServiceWorkerCleanupScript =
    process.env.NODE_ENV !== 'production'
      ? `
        (function () {
          try {
            if (!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
              return Promise.all(registrations.map(function (registration) {
                return registration.unregister();
              }));
            }).then(function () {
              if (!('caches' in window)) return;
              return caches.keys().then(function (keys) {
                return Promise.all(keys.filter(function (key) {
                  return key.indexOf('geo-challenge-') === 0;
                }).map(function (key) {
                  return caches.delete(key);
                }));
              });
            }).catch(function () {});
          } catch (error) {}
        })();
      `
      : '';

  return (
    <html lang="en">
      <body className={`${manrope.variable} bg-background font-sans text-ink antialiased`}>
        {devServiceWorkerCleanupScript && (
          <script dangerouslySetInnerHTML={{ __html: devServiceWorkerCleanupScript }} />
        )}
        {children}
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
