import { describe, expect, it } from 'vitest';
import { applyAction, canRun } from './actions';
import { computeRisk } from './risk';
import type { Portal } from './types';

const open: Portal = {
  id: 'a',
  name: 'Портал А',
  destinationWorld: 'Мир А',
  energy: 40,
  stability: 60,
  minutesToCollapse: 240,
  creaturesInside: 0,
  status: 'open',
  hasObserver: false,
  history: [],
};

const closed: Portal = { ...open, status: 'closed' };

describe('canRun — невозможные состояния', () => {
  it('нельзя стабилизировать закрытый портал', () => {
    const r = canRun('stabilize', closed);
    expect(r).toEqual({ ok: false, hard: true, reason: expect.stringMatching(/закрыт/i) });
  });

  it('нельзя стабилизировать уже стабильный портал (≥95)', () => {
    expect(canRun('stabilize', { ...open, stability: 96 }).ok).toBe(false);
  });

  it('нельзя закрыть уже закрытый портал', () => {
    expect(canRun('close', closed)).toMatchObject({ ok: false, hard: true });
  });

  it('закрытие портала с существами внутри требует подтверждения, но не запрещено', () => {
    const r = canRun('close', { ...open, creaturesInside: 3 });
    expect(r.ok).toBe(true);
    expect(r.ok && r.confirm).toMatch(/эвакуац|существ/i);
  });

  it('нельзя отправить наблюдателя в портал с критическим риском', () => {
    const crit: Portal = { ...open, energy: 97, stability: 6, minutesToCollapse: 8 };
    expect(computeRisk(crit).level).toBe('critical');
    expect(canRun('send_observer', crit)).toMatchObject({ ok: false, hard: true });
  });

  it('наблюдатель при высоком риске — с подтверждением', () => {
    const high: Portal = { ...open, energy: 78, stability: 30, minutesToCollapse: 60 };
    expect(computeRisk(high).level).toBe('high');
    const r = canRun('send_observer', high);
    expect(r.ok).toBe(true);
    expect(r.ok && r.confirm).toBeTruthy();
  });

  it('нельзя отправить второго наблюдателя', () => {
    expect(canRun('send_observer', { ...open, hasObserver: true })).toMatchObject({ ok: false });
  });

  it('нельзя пометить «под вопросом» закрытый портал и нельзя пометить дважды', () => {
    expect(canRun('mark_review', closed).ok).toBe(false);
    expect(canRun('mark_review', { ...open, status: 'under_review' }).ok).toBe(false);
  });

  it('снять «под вопросом» можно только с помеченного портала', () => {
    expect(canRun('clear_review', open).ok).toBe(false);
    expect(canRun('clear_review', { ...open, status: 'under_review' }).ok).toBe(true);
  });
});

describe('applyAction — эффекты', () => {
  it('стабилизация повышает стабильность, снижает энергию, добавляет время', () => {
    const { portal } = applyAction('stabilize', { ...open, stability: 40, energy: 70, minutesToCollapse: 30 });
    expect(portal.stability).toBe(65);
    expect(portal.energy).toBe(58);
    expect(portal.minutesToCollapse).toBe(50);
  });

  it('стабилизация не выводит значения за границы 0..100', () => {
    const { portal } = applyAction('stabilize', { ...open, stability: 90, energy: 5 });
    expect(portal.stability).toBe(100);
    expect(portal.energy).toBe(0);
  });

  it('закрытие снимает наблюдателя', () => {
    const { portal } = applyAction('close', { ...open, hasObserver: true });
    expect(portal.status).toBe('closed');
    expect(portal.hasObserver).toBe(false);
  });

  it('отправка наблюдателя выставляет флаг', () => {
    expect(applyAction('send_observer', open).portal.hasObserver).toBe(true);
  });
});
