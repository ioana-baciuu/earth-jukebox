import { describe, expect, it } from 'vitest';
import { ANNUAL_COSTS, KIOSK_COSTS, LAUNCH_COSTS, PRICING, REPAIR_RESERVE, breakEvenUnits, sumCosts } from '@/lib/business-estimates';

describe('business planning estimates', () => {
  it('totals the supplied kiosk items to €1,050–2,340', () => expect(sumCosts(KIOSK_COSTS)).toEqual({ low: 1050, high: 2340 }));
  it('totals the supplied launch items to €11,500–28,500', () => expect(sumCosts(LAUNCH_COSTS)).toEqual({ low: 11500, high: 28500 }));
  it('separates annual fixed costs from the €160 per-kiosk reserve', () => {
    expect(sumCosts(ANNUAL_COSTS)).toEqual({ low: 2100, high: 6100 });
    expect(REPAIR_RESERVE).toBe(160);
  });
  it('keeps proposed web access free', () => expect(PRICING[0]).toMatchObject({ low: 0, high: 0 }));
  it('keeps the proposed installed kiosk price at €3,500–6,000', () => expect(PRICING[1]).toMatchObject({ low: 3500, high: 6000 }));
  it('calculates 11 units for the simplified €4,000/€1,600/€25,000 example', () => expect(breakEvenUnits(4000, 1600, 25000)).toBe(11));
  it('does not claim break-even when a unit earns no contribution', () => expect(breakEvenUnits(1600, 1600, 25000)).toBeNull());
});