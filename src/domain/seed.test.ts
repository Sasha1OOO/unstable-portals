import { describe, expect, it } from 'vitest';
import { randomPortal } from './seed';

describe('randomPortal', () => {
  it('поля всегда в допустимых границах', () => {
    for (let i = 0; i < 500; i++) {
      const p = randomPortal(`t-${i}`);
      expect(p.energy).toBeGreaterThanOrEqual(0);
      expect(p.energy).toBeLessThanOrEqual(100);
      expect(p.stability).toBeGreaterThanOrEqual(0);
      expect(p.stability).toBeLessThanOrEqual(100);
      expect(p.minutesToCollapse).toBeGreaterThanOrEqual(0);
      expect(p.creaturesInside).toBeGreaterThanOrEqual(0);
      expect(p.creaturesInside).toBeLessThanOrEqual(8);
      expect(['open', 'under_review', 'closed']).toContain(p.status);
      expect(p.name).toMatch(/\S \S/);
      expect(p.history).toHaveLength(1);
    }
  });

  it('детерминирован при заданном ГПСЧ', () => {
    const rng = () => 0.5;
    expect(randomPortal('a', rng)).toMatchObject(randomPortal('a', rng));
  });

  it('генерирует разные порталы', () => {
    const names = new Set(Array.from({ length: 40 }, (_, i) => randomPortal(`x-${i}`).name));
    expect(names.size).toBeGreaterThan(1);
  });
});
