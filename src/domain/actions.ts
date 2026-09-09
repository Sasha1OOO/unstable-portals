import { computeRisk, RISK_LABEL } from './risk';
import { creatures } from './text';
import type { ActionType, Portal } from './types';

/**
 * ГАРДЫ ДЕЙСТВИЙ («невозможные состояния»)
 * =======================================
 * canRun() — единственный источник правды о том, разрешено ли действие.
 * UI обязан спрашивать его перед показом кнопки и перед выполнением.
 *
 *  - hard === true  → действие запрещено полностью, кнопка недоступна;
 *  - confirm задан   → действие возможно, но требует явного подтверждения
 *                      (например, закрытие портала с существами внутри).
 */

export type GuardResult =
  | { ok: true; confirm?: string }
  | { ok: false; hard: true; reason: string };

export const ACTION_LABEL: Record<ActionType, string> = {
  stabilize: 'Стабилизировать',
  close: 'Закрыть портал',
  send_observer: 'Отправить наблюдателя',
  mark_review: 'Пометить «под вопросом»',
  clear_review: 'Снять «под вопросом»',
};

const STABILIZE_STABILITY_GAIN = 25;
const STABILIZE_ENERGY_DROP = 12;
const STABILIZE_TIME_GAIN = 20;
export const STABILIZE_EFFECT = {
  STABILIZE_STABILITY_GAIN,
  STABILIZE_ENERGY_DROP,
  STABILIZE_TIME_GAIN,
};

export function canRun(action: ActionType, portal: Portal): GuardResult {
  const closed = portal.status === 'closed';
  const risk = computeRisk(portal);

  switch (action) {
    case 'stabilize': {
      if (closed) return { ok: false, hard: true, reason: 'Портал закрыт — стабилизировать нечего.' };
      if (portal.stability >= 95)
        return { ok: false, hard: true, reason: 'Портал уже стабилен (стабильность ≥ 95).' };
      return { ok: true };
    }

    case 'close': {
      if (closed) return { ok: false, hard: true, reason: 'Портал уже закрыт.' };
      if (portal.creaturesInside > 0)
        return {
          ok: true,
          confirm: `Внутри портала ещё ${creatures(portal.creaturesInside)}. Закрыть портал без эвакуации? Существа останутся в мире «${portal.destinationWorld}».`,
        };
      return { ok: true };
    }

    case 'send_observer': {
      if (closed) return { ok: false, hard: true, reason: 'Портал закрыт — отправлять наблюдателя некуда.' };
      if (portal.hasObserver)
        return { ok: false, hard: true, reason: 'Наблюдатель уже на месте.' };
      if (risk.level === 'critical')
        return {
          ok: false,
          hard: true,
          reason: 'Критический риск — отправка наблюдателя запрещена регламентом безопасности.',
        };
      if (risk.level === 'high')
        return {
          ok: true,
          confirm: `Риск портала — ${RISK_LABEL[risk.level]}. Отправить наблюдателя на свой страх и риск?`,
        };
      return { ok: true };
    }

    case 'mark_review': {
      if (closed) return { ok: false, hard: true, reason: 'Портал закрыт — статус менять нельзя.' };
      if (portal.status === 'under_review')
        return { ok: false, hard: true, reason: 'Портал уже помечен «под вопросом».' };
      return { ok: true };
    }

    case 'clear_review': {
      if (portal.status !== 'under_review')
        return { ok: false, hard: true, reason: 'Портал не помечен «под вопросом».' };
      return { ok: true };
    }

    default:
      return { ok: false, hard: true, reason: 'Неизвестное действие.' };
  }
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Применяет действие к порталу. Возвращает новый портал и сообщение для лога.
 * Вызывать только после успешного canRun() (при необходимости — с подтверждением).
 */
export function applyAction(
  action: ActionType,
  portal: Portal,
): { portal: Portal; message: string } {
  switch (action) {
    case 'stabilize': {
      const next: Portal = {
        ...portal,
        stability: clamp(portal.stability + STABILIZE_STABILITY_GAIN, 0, 100),
        energy: clamp(portal.energy - STABILIZE_ENERGY_DROP, 0, 100),
        minutesToCollapse: portal.minutesToCollapse + STABILIZE_TIME_GAIN,
      };
      return {
        portal: next,
        message: `Стабилизация: стабильность ${portal.stability}→${next.stability}, энергия ${portal.energy}→${next.energy}, время ${portal.minutesToCollapse}→${next.minutesToCollapse} мин.`,
      };
    }

    case 'close':
      return {
        portal: { ...portal, status: 'closed', hasObserver: false },
        message:
          portal.creaturesInside > 0
            ? `Портал закрыт принудительно, внутри оставалось ${creatures(portal.creaturesInside)}.`
            : 'Портал закрыт штатно.',
      };

    case 'send_observer':
      return {
        portal: { ...portal, hasObserver: true },
        message: 'Наблюдатель отправлен в портал.',
      };

    case 'mark_review':
      return {
        portal: { ...portal, status: 'under_review' },
        message: 'Портал помечен «под вопросом».',
      };

    case 'clear_review':
      return {
        portal: { ...portal, status: 'open' },
        message: 'С портала снята пометка «под вопросом».',
      };

    default:
      return { portal, message: 'Действие не выполнено.' };
  }
}
