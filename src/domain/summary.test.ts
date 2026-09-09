import { describe, expect, it } from 'vitest';
import { buildSummary } from './summary';
import { seedPortals } from './seed';

describe('buildSummary', () => {
  it('пустая лаборатория — все счётчики по нулям', () => {
    const s = buildSummary([]);
    expect(s).toMatchObject({ total: 0, open: 0, closed: 0, critical: 0 });
    expect(s.attention).toHaveLength(0);
  });

  it('сид: считает открытые / под вопросом / закрытые', () => {
    const s = buildSummary(seedPortals());
    expect(s.total).toBe(6);
    expect(s.open).toBe(4);
    expect(s.underReview).toBe(1);
    expect(s.closed).toBe(1);
    expect(s.critical).toBeGreaterThanOrEqual(1);
    expect(s.withObserver).toBe(1);
  });

  it('список «требуют внимания» отсортирован по убыванию риска и не содержит закрытых', () => {
    const s = buildSummary(seedPortals());
    expect(s.attention.length).toBeGreaterThan(0);
    expect(s.attention[0].level).toBe('critical');
    expect(s.attention.every((a) => a.portal.status !== 'closed')).toBe(true);

    const rank = { none: 0, low: 1, medium: 2, high: 3, critical: 4 } as const;
    for (let i = 1; i < s.attention.length; i++) {
      expect(rank[s.attention[i - 1].level]).toBeGreaterThanOrEqual(rank[s.attention[i].level]);
    }
  });
});
