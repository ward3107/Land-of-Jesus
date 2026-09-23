import { describe, expect, it } from 'vitest';
import {
  formatRate,
  joinConversionRate,
  summarizeDelivery,
  type DeliveryTotals,
} from './analytics';

describe('summarizeDelivery', () => {
  it('computes delivery and failure rates from measured counts', () => {
    const totals: DeliveryTotals = { attempted: 100, accepted: 90, failed: 6, invalid: 4 };
    const s = summarizeDelivery(totals);
    expect(s.deliveryRate).toBeCloseTo(0.9);
    expect(s.failureRate).toBeCloseTo(0.1);
  });

  it('never divides by zero on an empty audience', () => {
    const s = summarizeDelivery({ attempted: 0, accepted: 0, failed: 0, invalid: 0 });
    expect(s.deliveryRate).toBe(0);
    expect(s.failureRate).toBe(0);
  });

  it('clamps a negative attempted count', () => {
    const s = summarizeDelivery({ attempted: -5, accepted: 0, failed: 0, invalid: 0 });
    expect(s.attempted).toBe(0);
    expect(s.deliveryRate).toBe(0);
  });
});

describe('formatRate', () => {
  it('renders a whole-number percent', () => {
    expect(formatRate(0.9333)).toBe('93%');
    expect(formatRate(0)).toBe('0%');
    expect(formatRate(1)).toBe('100%');
  });

  it('clamps out-of-range values', () => {
    expect(formatRate(1.5)).toBe('100%');
    expect(formatRate(-0.2)).toBe('0%');
  });
});

describe('joinConversionRate', () => {
  it('is follows / scans', () => {
    expect(joinConversionRate({ scans: 200, opens: 120, installs: 80, follows: 50 })).toBeCloseTo(0.25);
  });
  it('is 0 with no scans', () => {
    expect(joinConversionRate({ scans: 0, opens: 0, installs: 0, follows: 3 })).toBe(0);
  });
});
