import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--color-bg) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        ink: 'hsl(var(--color-ink) / <alpha-value>)',
        muted: 'hsl(var(--color-muted) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        danger: 'hsl(var(--color-danger) / <alpha-value>)'
      },
      boxShadow: {
        soft: '0 14px 36px rgba(2, 6, 23, 0.42), 0 2px 10px rgba(2, 6, 23, 0.25)'
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'panel-in': {
          '0%': { transform: 'translateX(32px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slide-in 220ms ease-out',
        'fade-in': 'fade-in 220ms ease-out',
        'panel-in': 'panel-in 240ms ease-out'
      }
    }
  },
  plugins: []
};

export default config;