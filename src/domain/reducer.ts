import { applyAction, canRun } from './actions';
import { computeRisk } from './risk';
import { criticalPortal, seedPortals } from './seed';
import type { ActionType, LogEntry, Portal, PortalHistoryEntry } from './types';

export interface LabState {
  portals: Portal[];
  log: LogEntry[];
}

export type LabEvent =
  | { type: 'RUN_ACTION'; portalId: string; action: ActionType; confirmed?: boolean }
  | { type: 'LOAD_SEED' }
  | { type: 'LOAD_EMPTY' }
  | { type: 'ADD_CRITICAL' }
  | { type: 'RESET' };

let counter = 0;
function id(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function now(): string {
  return new Date().toISOString();
}

function log(entry: Omit<LogEntry, 'id' | 'at'>): LogEntry {
  return { id: id('log'), at: now(), ...entry };
}

export function initialState(): LabState {
  return {
    portals: seedPortals(),
    log: [
      log({
        portalId: null,
        portalName: 'Лаборатория',
        kind: 'system',
        message: `Смена принята. Порталов на контроле: ${seedPortals().length}.`,
      }),
    ],
  };
}

export function labReducer(state: LabState, event: LabEvent): LabState {
  switch (event.type) {
    case 'LOAD_SEED':
      return {
        portals: seedPortals(),
        log: [
          log({ portalId: null, portalName: 'Лаборатория', kind: 'system', message: 'Загружен демонстрационный набор порталов.' }),
          ...state.log,
        ],
      };

    case 'LOAD_EMPTY':
      return {
        portals: [],
        log: [
          log({ portalId: null, portalName: 'Лаборатория', kind: 'system', message: 'Список порталов очищен. Все контуры сняты с контроля.' }),
          ...state.log,
        ],
      };

    case 'ADD_CRITICAL': {
      const portal = criticalPortal(id('p-crit'));
      return {
        portals: [portal, ...state.portals],
        log: [
          log({ portalId: portal.id, portalName: portal.name, kind: 'system', message: 'Зарегистрирован новый портал с критическим риском.' }),
          ...state.log,
        ],
      };
    }

    case 'RESET':
      return initialState();

    case 'RUN_ACTION': {
      const portal = state.portals.find((p) => p.id === event.portalId);
      if (!portal) return state;

      const guard = canRun(event.action, portal);

      // Жёсткая блокировка — фиксируем попытку и ничего не меняем.
      if (guard.ok === false) {
        return {
          ...state,
          log: [
            log({ portalId: portal.id, portalName: portal.name, kind: 'blocked', message: `Отклонено: ${guard.reason}` }),
            ...state.log,
          ],
        };
      }

      // Нужно подтверждение, а его не дали — тоже не выполняем.
      if (guard.confirm && !event.confirmed) {
        return {
          ...state,
          log: [
            log({ portalId: portal.id, portalName: portal.name, kind: 'blocked', message: `Требуется подтверждение: ${guard.confirm}` }),
            ...state.log,
          ],
        };
      }

      const riskBefore = computeRisk(portal).level;
      const { portal: updated, message } = applyAction(event.action, portal);
      const riskAfter = computeRisk(updated).level;

      const historyEntry: PortalHistoryEntry = {
        id: id('h'),
        at: now(),
        message: guard.confirm ? `${message} (выполнено с подтверждением)` : message,
        riskBefore,
        riskAfter,
      };

      const withHistory: Portal = { ...updated, history: [historyEntry, ...updated.history] };

      return {
        portals: state.portals.map((p) => (p.id === portal.id ? withHistory : p)),
        log: [
          log({
            portalId: portal.id,
            portalName: portal.name,
            kind: 'action',
            message:
              riskBefore !== riskAfter
                ? `${message} Риск: ${riskBefore} → ${riskAfter}.`
                : message,
          }),
          ...state.log,
        ],
      };
    }

    default:
      return state;
  }
}
