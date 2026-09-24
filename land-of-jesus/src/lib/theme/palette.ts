/**
 * Land of Jesus palette, sampled (k-means) from the site's own Holy Land
 * photos in public/images. This is the typed source of truth:
 * src/app/globals.css `@theme` must mirror it exactly
 * (tests/unit/theme/css-sync.test.ts), and every text/background pair the UI
 * uses is contrast-checked in tests/unit/theme/palette.test.ts.
 */
export const semantic = {
  linen: '#f6f3ec', // page background: lightened Jerusalem stone
  surface: '#ffffff', // cards, sheets
  hairline: '#ded9cf', // separators, card borders
  sand: '#cdbb9f', // subtle fills
  gold: '#e0c68e', // limestone at golden hour: highlights, progress track
  night: '#32261d', // primary text: cedar shadow
  muted: '#6b645b', // secondary text
  sea: '#4a6891', // Sea of Galilee, darkened: info
  sky: '#aabdd8', // Galilee sky: info tint
  hills: '#455f3f', // Galilee hills: verified / success
  olive: '#4f4e37', // olive: tertiary accent
} as const;

/** Cedar: replaces the old terracotta `primary-*` scale. White text on 600+ only. */
export const primary = {
  50: '#faf6ef',
  100: '#f3eadb',
  200: '#e6d4b8',
  300: '#d4b98f',
  400: '#b8925f',
  500: '#9a7748',
  600: '#81623f',
  700: '#6b5033',
  800: '#54402a',
  900: '#3f2f20',
  950: '#2a1f15',
} as const;

/** Jerusalem stone: overrides Tailwind's default stone. 400 is decorative only. */
export const stone = {
  50: '#f6f3ec',
  100: '#efeae1',
  200: '#ded9cf',
  300: '#cbc3b6',
  400: '#a79e90',
  500: '#716a60',
  600: '#6b645b',
  700: '#544d45',
  800: '#3d342c',
  900: '#32261d',
  950: '#211a14',
} as const;

/** Galilee hills: overrides the Tailwind green shades the app uses. */
export const green = {
  50: '#f1f5ef',
  100: '#e1eadd',
  200: '#c5d4be',
  500: '#5f7d57',
  600: '#4f6b48',
  700: '#455f3f',
} as const;

/** Every token as the CSS custom property globals.css must define. */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, hex] of Object.entries(semantic)) vars[`--color-${name}`] = hex;
  for (const [step, hex] of Object.entries(primary)) vars[`--color-primary-${step}`] = hex;
  for (const [step, hex] of Object.entries(stone)) vars[`--color-stone-${step}`] = hex;
  for (const [step, hex] of Object.entries(green)) vars[`--color-green-${step}`] = hex;
  return vars;
}
