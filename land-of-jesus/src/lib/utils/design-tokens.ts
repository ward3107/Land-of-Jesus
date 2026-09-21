/**
 * Design Tokens for Land of Jesus
 * 
 * Based on Stitch design reference extraction
 * Premium documentary, cultural heritage, warm, respectful, modern, editorial
 */

export const colors = {
  // Primary brand colors
  primary: {
    50: '#fef7f0',
    100: '#fdf0e0',
    200: '#fae0c2',
    300: '#f7cca0',
    400: '#f3b078',
    500: '#ef9450', // Primary brand - warm terracotta
    600: '#e87a32',
    700: '#d65f1e',
    800: '#b34a1a',
    900: '#8f3b18',
    950: '#4a1b09',
  },
  // Secondary - stone/earth tones
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  // Accent - olive green (symbolic)
  olive: {
    50: '#f9faf6',
    100: '#f2f5eb',
    200: '#e5ebd6',
    300: '#d2deb9',
    400: '#b5c992',
    500: '#94b366', // Olive accent
    600: '#76964a',
    700: '#5d763b',
    800: '#4a5d32',
    900: '#3d4b2b',
    950: '#1c2314',
  },
  // Semantic colors
  success: {
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    500: '#ef4444',
    600: '#dc2626',
  },
  info: {
    500: '#3b82f6',
    600: '#2563eb',
  },
} as const;

export const typography = {
  // Editorial serif for headings
  serif: {
    family: 'var(--font-eb-garamond), Georgia, serif',
  },
  // UI/body sans-serif
  sans: {
    family: 'var(--font-plus-jakarta-sans), system-ui, sans-serif',
  },
  // Scale based on editorial rhythm
  scale: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
  },
  lineHeights: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const radii = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const contentWidths = {
  prose: '65ch',
  narrow: 'max-w-2xl',
  base: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-full',
} as const;

export const motion = {
  durations: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
} as const;
