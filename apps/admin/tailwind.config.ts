import type { Config } from 'tailwindcss';

/**
 * Neutral, premium SaaS palette — intentionally not religion-specific so the
 * product suits churches, schools, nonprofits, municipalities and businesses
 * alike (see docs/DECISIONS.md §Design).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
