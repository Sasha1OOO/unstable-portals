/** Доменные типы лаборатории порталов. */

export type PortalStatus = 'open' | 'under_review' | 'closed';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Тип действия смотрителя над порталом. */
export type ActionType =
  | 'stabilize'
  | 'close'
  | 'send_observer'
  | 'evacuate'
  | 'mark_review'
  | 'clear_review';

export interface Portal {
  id: string;
  /** Название портала. */
  name: string;
  /** Мир назначения. */
  destinationWorld: string;
  /** Уровень энергии, 0..100 (условные единицы). */
  energy: number;
  /** Стабильность, 0..100 (100 — идеально стабилен). */
  stability: number;
  /** Время до схлопывания в минутах. */
  minutesToCollapse: number;
  /** Количество существ внутри портала. */
  creaturesInside: number;
  /** Текущий статус. */
  status: PortalStatus;
  /** Отправлен ли наблюдатель. */
  hasObserver: boolean;
  /** История изменений конкретного портала (новые записи в начале). */
  history: PortalHistoryEntry[];
}

export interface PortalHistoryEntry {
  id: string;
  at: string; // ISO-время
  /** Человекочитаемое описание того, что произошло. */
  message: string;
  /** Риск до и после операции (если применимо). */
  riskBefore?: RiskLevel;
  riskAfter?: RiskLevel;
}

export interface LogEntry {
  id: string;
  at: string; // ISO-время
  portalId: string | null;
  portalName: string;
  /** 'action' — успешное действие, 'blocked' — заблокированная попытка, 'system' — системное событие. */
  kind: 'action' | 'blocked' | 'system';
  message: string;
}

/** Результат разбора формулы риска — используется в карточке портала. */
export interface RiskBreakdown {
  score: number; // 0..100
  level: RiskLevel;
  /** Слагаемые формулы для объяснения в UI. */
  parts: RiskPart[];
  /** Сработавшие жёсткие правила (override). */
  overrides: string[];
}

export interface RiskPart {
  label: string;
  /** Вклад в итоговый счёт, 0..100 до взвешивания. */
  raw: number;
  weight: number;
  /** raw * weight. */
  contribution: number;
  hint: string;
}
