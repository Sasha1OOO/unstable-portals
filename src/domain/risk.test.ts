import { describe, expect, it } from 'vitest';
import {
  computeRisk,
  creaturePressure,
  RISK_WEIGHTS,
  recommendedAction,
  scoreToLevel,
  timePressure,
} from './risk';
import { seedPortals } from './seed';
import type { Portal } from './types';

const base: Portal = {
  id: 't',
  name: 'Тестовый портал',
  destinationWorld: 'Нигде',
  energy: 50,
  stability: 50,
  minutesToCollapse: 200,
  creaturesInside: 0,
  status: 'open',
  hasObserver: false,
  history: [],
};

describe('вспомогательные функции формулы', () => {
  it('timePressure: 0 минут = максимум, >=100 минут = 0', () => {
    expect(timePressure(0)).toBe(100);
    expect(timePressure(100)).toBe(0);
    expect(timePressure(1000)).toBe(0);
    expect(timePressure(70)).toBe(30);
  });

  it('creaturePressure ограничена 10 существами', () => {
    expect(creaturePressure(0)).toBe(0);
    expect(creaturePressure(5)).toBe(50);
    expect(creaturePressure(10)).toBe(100);
    expect(creaturePressure(50)).toBe(100);
  });

  it('веса формулы в сумме дают 1', () => {
    const sum = Object.values(RISK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('scoreToLevel уважает пороги 25/50/75', () => {
    expect(scoreToLevel(0)).toBe('low');
    expect(scoreToLevel(24.9)).toBe('low');
    expect(scoreToLevel(25)).toBe('medium');
    expect(scoreToLevel(49.9)).toBe('medium');
    expect(scoreToLevel(50)).toBe('high');
    expect(scoreToLevel(74.9)).toBe('high');
    expect(scoreToLevel(75)).toBe('critical');
  });
});

describe('computeRisk', () => {
  it('идеально стабильный портал с запасом времени — низкий риск', () => {
    const r = computeRisk({ ...base, energy: 10, stability: 95, minutesToCollapse: 600 });
    expect(r.level).toBe('low');
    expect(r.score).toBeLessThan(25);
  });

  it('счёт = сумме взвешенных вкладов', () => {
    const r = computeRisk(base);
    const manual =
      0.45 * 50 + // нестабильность (100-50)
      0.3 * 50 + // энергия
      0.15 * 0 + // 200 минут -> дефицита нет
      0.1 * 0; // существ нет
    expect(r.score).toBeCloseTo(manual, 6);
    expect(r.parts).toHaveLength(4);
  });

  it('override: ≤10 минут до схлопывания поднимает риск минимум до high', () => {
    const r = computeRisk({ ...base, energy: 20, stability: 90, minutesToCollapse: 5 });
    expect(r.level).toBe('high');
    expect(r.overrides.join(' ')).toMatch(/10 мин/);
  });

  it('override: стабильность<15 и энергия>80 — всегда critical', () => {
    const r = computeRisk({ ...base, energy: 85, stability: 10, minutesToCollapse: 600 });
    expect(r.level).toBe('critical');
    expect(r.overrides.length).toBeGreaterThan(0);
  });

  it('закрытый портал риска не несёт', () => {
    const r = computeRisk({ ...base, status: 'closed', energy: 100, stability: 0 });
    expect(r.level).toBe('none');
    expect(r.score).toBe(0);
  });

  it('сид «Бездонный зев» — критический, «Изумрудная арка» — низкий', () => {
    const portals = seedPortals();
    const abyss = portals.find((p) => p.id === 'p-abyss')!;
    const emerald = portals.find((p) => p.id === 'p-emerald')!;
    expect(computeRisk(abyss).level).toBe('critical');
    expect(computeRisk(emerald).level).toBe('low');
  });
});

describe('recommendedAction', () => {
  it('для критического портала с существами — эвакуация и закрытие', () => {
    const text = recommendedAction({ ...base, energy: 97, stability: 6, minutesToCollapse: 8, creaturesInside: 3 });
    expect(text).toMatch(/эвакуир/i);
    expect(text).toMatch(/закр/i);
  });

  it('для закрытого портала — действий не требуется', () => {
    expect(recommendedAction({ ...base, status: 'closed' })).toMatch(/не требуется/i);
  });
});
