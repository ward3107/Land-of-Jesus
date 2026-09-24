import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, isActivePath } from '@/components/layout/nav-items';

const item = (key: string) => NAV_ITEMS.find((i) => i.key === key)!;

describe('NAV_ITEMS', () => {
  it('lists the five existing routes in tab order', () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual(['/', '/explore', '/projects', '/stories', '/visit']);
  });
});

describe('isActivePath', () => {
  it('matches Home only on "/"', () => {
    expect(isActivePath('/', item('home'))).toBe(true);
    expect(isActivePath('/explore', item('home'))).toBe(false);
  });

  it('matches a route and its children', () => {
    expect(isActivePath('/projects', item('projects'))).toBe(true);
    expect(isActivePath('/projects/basilica-restoration-phase1', item('projects'))).toBe(true);
  });

  it('ignores routes that only share a prefix', () => {
    expect(isActivePath('/explorer', item('explore'))).toBe(false);
  });

  it('treats church profiles as part of Explore', () => {
    expect(isActivePath('/churches/holy-sepulchre-jerusalem', item('explore'))).toBe(true);
  });
});
