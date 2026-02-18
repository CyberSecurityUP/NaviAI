import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navi: {
          bg: 'var(--navi-bg)',
          text: 'var(--navi-text)',
          primary: 'var(--navi-primary)',
          'primary-light': 'var(--navi-primary-light)',
          surface: 'var(--navi-surface)',
          'surface-hover': 'var(--navi-surface-hover)',
          danger: 'var(--navi-danger)',
          success: 'var(--navi-success)',
        },
      },
      borderRadius: {
        navi: 'var(--navi-border-radius)',
      },
      minWidth: {
        tap: 'var(--navi-min-tap-size)',
      },
      minHeight: {
        tap: 'var(--navi-min-tap-size)',
      },
      fontSize: {
        'navi-sm': 'calc(0.875rem * var(--navi-font-scale))',
        'navi-base': 'calc(1rem * var(--navi-font-scale))',
        'navi-lg': 'calc(1.125rem * var(--navi-font-scale))',
        'navi-xl': 'calc(1.25rem * var(--navi-font-scale))',
        'navi-2xl': 'calc(1.5rem * var(--navi-font-scale))',
        'navi-3xl': 'calc(1.875rem * var(--navi-font-scale))',
        'navi-4xl': 'calc(2.25rem * var(--navi-font-scale))',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'mic-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217, 48, 37, 0.4)' },
          '50%': { boxShadow: '0 0 0 20px rgba(217, 48, 37, 0)' },
        },
        'voice-pulse-inner': {
          '0%': { transform: 'scale(0.95)', opacity: '0.6' },
          '50%': { transform: 'scale(1.05)', opacity: '0.3' },
          '100%': { transform: 'scale(0.95)', opacity: '0.6' },
        },
        'voice-pulse-mid': {
          '0%': { transform: 'scale(0.9)', opacity: '0.5' },
          '50%': { transform: 'scale(1.1)', opacity: '0.2' },
          '100%': { transform: 'scale(0.9)', opacity: '0.5' },
        },
        'voice-pulse-outer': {
          '0%': { transform: 'scale(0.85)', opacity: '0.4' },
          '50%': { transform: 'scale(1.15)', opacity: '0.1' },
          '100%': { transform: 'scale(0.85)', opacity: '0.4' },
        },
      },
      animation: {
        'mic-pulse': 'mic-pulse 1.5s ease-in-out infinite',
        'voice-pulse-inner': 'voice-pulse-inner 1.5s ease-in-out infinite',
        'voice-pulse-mid': 'voice-pulse-mid 1.8s ease-in-out infinite 0.2s',
        'voice-pulse-outer': 'voice-pulse-outer 2.1s ease-in-out infinite 0.4s',
      },
    },
  },
  plugins: [],
};

export default config;
