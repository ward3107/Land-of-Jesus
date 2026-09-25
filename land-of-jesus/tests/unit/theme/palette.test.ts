import { describe, it, expect } from 'vitest';
import { contrastRatio } from '@/lib/theme/contrast';
import { green, primary, semantic, stone } from '@/lib/theme/palette';

const WHITE = '#ffffff';

/** Alpha-mix `top` over `bottom` (both `#rrggbb`), per-channel, like the browser does. */
function mix(top: string, bottom: string, alpha: number): string {
  const [t, b] = [top, bottom].map((hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  });
  const channel = (i: number) => Math.round(alpha * t[i] + (1 - alpha) * b[i]);
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`;
}

// [foreground, background, where it is used]
const TEXT_PAIRS: [string, string, string][] = [
  [semantic.night, semantic.linen, 'body text on page'],
  [semantic.night, semantic.surface, 'text on cards'],
  [semantic.muted, semantic.linen, 'secondary text on page'],
  [semantic.muted, semantic.surface, 'secondary text on cards'],
  [semantic.muted, stone[100], 'placeholder / segmented control'],
  [stone[500], semantic.linen, 'stone-500 text'],
  [stone[700], stone[100], 'chips'],
  [WHITE, primary[600], 'filled button'],
  [WHITE, primary[700], 'filled button pressed'],
  [primary[600], semantic.linen, 'active tab label'],
  [primary[700], semantic.linen, 'links on page'],
  [primary[700], semantic.surface, 'links on cards'],
  [primary[700], primary[100], 'project badge'],
  [primary[800], primary[100], 'tinted button / notice'],
  [semantic.sea, semantic.surface, 'info text on cards'],
  [semantic.sea, semantic.linen, 'info text on page'],
  [WHITE, semantic.hills, 'verified pill'],
  [WHITE, green[600], 'success fill'],
  [green[700], green[100], 'open-to-visitors badge'],
  [semantic.night, semantic.gold, 'text on gold'],
  [WHITE, semantic.night, 'text on dark band'],
  [primary[300], semantic.night, 'link on dark hero'],
];

// Non-text UI (WCAG 1.4.11): 3:1
const UI_PAIRS: [string, string, string][] = [
  [primary[500], semantic.linen, 'focus ring on page'],
  [primary[500], semantic.surface, 'focus ring on cards'],
  [primary[600], semantic.gold, 'progress fill vs solid gold track'],
];

describe('photo palette contrast', () => {
  it.each(TEXT_PAIRS)('%s on %s (%s) passes AA text 4.5:1', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s vs %s (%s) passes 3:1', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it('keeps white off primary-500 (it fails AA)', () => {
    expect(contrastRatio(WHITE, primary[500])).toBeLessThan(4.5);
  });

  describe('labels on the frosted bar over the darkest content', () => {
    // frosted = linen at 78% alpha; worst case is over the darkest content (night).
    const worstCaseBar = mix(semantic.linen, semantic.night, 0.78);

    it('inactive tab/nav label (stone-700) passes AA', () => {
      expect(contrastRatio(stone[700], worstCaseBar)).toBeGreaterThanOrEqual(4.5);
    });

    it('active tab/nav label (primary-800) passes AA', () => {
      expect(contrastRatio(primary[800], worstCaseBar)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
