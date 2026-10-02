import { describe, expect, it } from 'vitest';
import { directionsUrl, parseTrip, staysUrl } from '@/lib/trips/plan';

const known = new Set(['nativity', 'annunciation']);
const base = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Pilgrimage',
  startDate: '2026-10-02',
  days: 2,
  stops: [{ slug: 'nativity', day: 1, transport: 'walk' }],
};

describe('trip plan validation', () => {
  it('accepts a saved plan for known places', () => {
    expect(parseTrip(base, known)).toEqual(base);
  });

  it('rejects unknown places and a stop outside the trip days', () => {
    expect(parseTrip({ ...base, stops: [{ slug: 'made-up', day: 1, transport: 'walk' }] }, known)).toBeNull();
    expect(parseTrip({ ...base, stops: [{ slug: 'nativity', day: 3, transport: 'taxi' }] }, known)).toBeNull();
  });

  it('makes external navigation and lodging links with coordinates', () => {
    const a = { latitude: 31.7, longitude: 35.2 };
    const b = { latitude: 32.7, longitude: 35.3 };
    expect(directionsUrl(a, b, 'walk')).toContain('travelmode=walking');
    expect(directionsUrl(a, b, 'taxi')).toContain('travelmode=driving');
    expect(staysUrl(a)).toContain('hotels%20near%2031.7%2C35.2');
  });
});
