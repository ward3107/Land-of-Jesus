import { describe, it, expect } from 'vitest';
import { contrastRatio, relativeLuminance } from '@/lib/theme/contrast';

describe('contrast', () => {
  it('computes WCAG relative luminance', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('computes the WCAG contrast ratio, order-independent', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#81623f', '#81623f')).toBe(1);
  });

  it('rejects anything but #rrggbb', () => {
    expect(() => relativeLuminance('red')).toThrow(/#rrggbb/);
  });
});
