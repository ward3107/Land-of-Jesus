import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { cssVariables } from '@/lib/theme/palette';

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

describe('globals.css mirrors src/lib/theme/palette.ts', () => {
  it.each(Object.entries(cssVariables()))('defines %s: %s', (name, hex) => {
    expect(css).toMatch(new RegExp(`${name}:\\s*${hex};`, 'i'));
  });

  it('uses system fonts only (no next/font variables)', () => {
    expect(css).not.toMatch(/--font-(jakarta|garamond)/);
    expect(css).toMatch(/--font-serif:\s*ui-serif/);
    expect(css).toMatch(/--font-sans:\s*system-ui/);
  });

  it('keeps motion behind reduced-motion guards', () => {
    expect(css).toMatch(/@supports \(animation-timeline: scroll\(\)\)/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });
});
