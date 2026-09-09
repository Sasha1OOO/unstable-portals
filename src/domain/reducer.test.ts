import { beforeEach, describe, expect, it } from 'vitest';
import { computeRisk } from './risk';
import { initialState, labReducer, type LabState } from './reducer';

let state: LabState;
beforeEach(() => {
  state = initialState();
});

describe('labReducer', () => {
  it('стартовое состояние содержит порталы и системную запись в журнале', () => {
    expect(state.portals.length).toBeGreaterThan(0);
    expect(state.log[0].kind).toBe('system');
  });

  it('пустой список: LOAD_EMPTY убирает все порталы, журнал сохраняется', () => {
    const next = labReducer(state, { type: 'LOAD_EMPTY' });
    expect(next.portals).toHaveLength(0);
    expect(next.log.length).toBe(state.log.length + 1);
    expect(next.log[0].message).toMatch(/очищен/i);
  });

  it('запрещённое действие не меняет порталы и попадает в журнал как blocked', () => {
    const next = labReducer(state, { type: 'RUN_ACTION', portalId: 'p-sealed', action: 'stabilize' });
    expect(next.portals).toEqual(state.portals);
    expect(next.log[0].kind).toBe('blocked');
    expect(next.log[0].message).toMatch(/закрыт/i);
  });

  it('действие с неизвестным порталом безопасно игнорируется', () => {
    const next = labReducer(state, { type: 'RUN_ACTION', portalId: 'нет-такого', action: 'close' });
    expect(next).toBe(state);
  });

  it('закрытие портала с существами без подтверждения — blocked; с подтверждением — выполняется', () => {
    const blocked = labReducer(state, { type: 'RUN_ACTION', portalId: 'p-amber', action: 'close' });
    expect(blocked.portals.find((p) => p.id === 'p-amber')!.status).toBe('open');
    expect(blocked.log[0].kind).toBe('blocked');

    const done = labReducer(state, { type: 'RUN_ACTION', portalId: 'p-amber', action: 'close', confirmed: true });
    expect(done.portals.find((p) => p.id === 'p-amber')!.status).toBe('closed');
    expect(done.log[0].kind).toBe('action');
  });

  it('изменение риска после стабилизации: уровень падает, запись истории хранит before/after', () => {
    const before = computeRisk(state.portals.find((p) => p.id === 'p-storm')!).level;
    let s = state;
    // одна стабилизация «Грозовых врат» (stability 34 -> 59 -> ...)
    s = labReducer(s, { type: 'RUN_ACTION', portalId: 'p-storm', action: 'stabilize' });
    s = labReducer(s, { type: 'RUN_ACTION', portalId: 'p-storm', action: 'stabilize' });
    const portal = s.portals.find((p) => p.id === 'p-storm')!;
    const after = computeRisk(portal).level;

    const order = ['none', 'low', 'medium', 'high', 'critical'];
    expect(order.indexOf(after)).toBeLessThan(order.indexOf(before));

    const hist = portal.history[0];
    expect(hist.riskBefore).toBeDefined();
    expect(hist.riskAfter).toBeDefined();
  });

  it('журнал после нескольких операций: порядок «сверху вниз» = от новых к старым', () => {
    let s = state;
    s = labReducer(s, { type: 'RUN_ACTION', portalId: 'p-storm', action: 'mark_review' });
    s = labReducer(s, { type: 'RUN_ACTION', portalId: 'p-storm', action: 'stabilize' });
    s = labReducer(s, { type: 'RUN_ACTION', portalId: 'p-abyss', action: 'send_observer' }); // critical -> blocked
    s = labReducer(s, { type: 'RUN_ACTION', portalId: 'p-emerald', action: 'send_observer' });

    const kinds = s.log.slice(0, 4).map((e) => e.kind);
    expect(kinds).toEqual(['action', 'blocked', 'action', 'action']);

    const times = s.log.map((e) => Date.parse(e.at));
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  });

  it('ADD_CRITICAL добавляет портал с критическим риском в начало списка', () => {
    const next = labReducer(state, { type: 'ADD_CRITICAL' });
    expect(next.portals.length).toBe(state.portals.length + 1);
    expect(computeRisk(next.portals[0]).level).toBe('critical');
  });

  it('ADD_RANDOM добавляет валидный портал в начало списка и пишет в журнал', () => {
    const next = labReducer(state, { type: 'ADD_RANDOM' });
    expect(next.portals.length).toBe(state.portals.length + 1);
    const p = next.portals[0];
    expect(p.energy).toBeGreaterThanOrEqual(0);
    expect(p.energy).toBeLessThanOrEqual(100);
    expect(p.stability).toBeLessThanOrEqual(100);
    expect(next.log[0].kind).toBe('system');
    expect(next.log[0].message).toMatch(/сканер/i);
  });
});
