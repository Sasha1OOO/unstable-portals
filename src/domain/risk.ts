import type { Portal, RiskBreakdown, RiskLevel, RiskPart } from './types';

/**
 * РАСЧЁТ РИСКА ПОРТАЛА
 * ====================
 * Идея: риск тем выше, чем ниже стабильность, выше энергия, меньше времени
 * до схлопывания и чем больше существ внутри (растёт цена ошибки).
 *
 * Каждое слагаемое приводится к шкале 0..100, затем умножается на вес.
 * Сумма весов = 1, поэтому итоговый счёт тоже в диапазоне 0..100.
 *
 *   score = 0.45 * (100 - stability)          // нестабильность
 *         + 0.30 * energy                      // энергия
 *         + 0.15 * timePressure                // дефицит времени
 *         + 0.10 * creaturePressure            // существа внутри
 *
 *   timePressure    = clamp(100 - minutesToCollapse, 0, 100)
 *                     (то есть <100 минут начинает давить, 0 минут = 100)
 *   creaturePressure = min(creaturesInside, 10) / 10 * 100
 *
 * Пороги уровней:
 *   score < 25            → low
 *   25 <= score < 50      → medium
 *   50 <= score < 75      → high
 *   score >= 75           → critical
 *
 * Жёсткие правила (override), поднимающие уровень независимо от счёта:
 *   - minutesToCollapse <= 10  → не ниже high
 *   - stability < 15 И energy > 80 → critical (каскадный разрыв)
 *
 * Закрытый портал риска не несёт → level = 'none', score = 0.
 */

export const RISK_WEIGHTS = {
  instability: 0.45,
  energy: 0.3,
  time: 0.15,
  creatures: 0.1,
} as const;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function timePressure(minutesToCollapse: number): number {
  return clamp(100 - minutesToCollapse, 0, 100);
}

export function creaturePressure(creaturesInside: number): number {
  return (Math.min(Math.max(creaturesInside, 0), 10) / 10) * 100;
}

export function scoreToLevel(score: number): Exclude<RiskLevel, 'none'> {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

const LEVEL_ORDER: RiskLevel[] = ['none', 'low', 'medium', 'high', 'critical'];

function atLeast(level: RiskLevel, floor: RiskLevel): RiskLevel {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(floor) ? level : floor;
}

export function computeRisk(portal: Portal): RiskBreakdown {
  if (portal.status === 'closed') {
    return { score: 0, level: 'none', parts: [], overrides: [] };
  }

  const instabilityRaw = clamp(100 - portal.stability, 0, 100);
  const energyRaw = clamp(portal.energy, 0, 100);
  const timeRaw = timePressure(portal.minutesToCollapse);
  const creatureRaw = creaturePressure(portal.creaturesInside);

  const parts: RiskPart[] = [
    {
      label: 'Нестабильность',
      raw: instabilityRaw,
      weight: RISK_WEIGHTS.instability,
      contribution: instabilityRaw * RISK_WEIGHTS.instability,
      hint: `стабильность ${portal.stability} → нестабильность ${Math.round(instabilityRaw)}`,
    },
    {
      label: 'Энергия',
      raw: energyRaw,
      weight: RISK_WEIGHTS.energy,
      contribution: energyRaw * RISK_WEIGHTS.energy,
      hint: `уровень энергии ${portal.energy}`,
    },
    {
      label: 'Дефицит времени',
      raw: timeRaw,
      weight: RISK_WEIGHTS.time,
      contribution: timeRaw * RISK_WEIGHTS.time,
      hint: `${portal.minutesToCollapse} мин до схлопывания`,
    },
    {
      label: 'Существа внутри',
      raw: creatureRaw,
      weight: RISK_WEIGHTS.creatures,
      contribution: creatureRaw * RISK_WEIGHTS.creatures,
      hint: `${portal.creaturesInside} существ (цена ошибки)`,
    },
  ];

  const score = clamp(
    parts.reduce((sum, p) => sum + p.contribution, 0),
    0,
    100,
  );

  let level: RiskLevel = scoreToLevel(score);
  const overrides: string[] = [];

  if (portal.minutesToCollapse <= 10) {
    const bumped = atLeast(level, 'high');
    if (bumped !== level) {
      overrides.push('До схлопывания ≤ 10 мин → риск не ниже «высокого»');
      level = bumped;
    }
  }

  if (portal.stability < 15 && portal.energy > 80) {
    if (level !== 'critical') {
      overrides.push('Стабильность < 15 и энергия > 80 → каскадный разрыв, риск «критический»');
      level = 'critical';
    }
  }

  return { score, level, parts, overrides };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  none: 'нет',
  low: 'низкий',
  medium: 'средний',
  high: 'высокий',
  critical: 'критический',
};

/** Рекомендуемое действие по уровню риска. */
export function recommendedAction(portal: Portal): string {
  if (portal.status === 'closed') return 'Портал закрыт. Действий не требуется.';
  const { level } = computeRisk(portal);
  switch (level) {
    case 'critical':
      return portal.creaturesInside > 0
        ? 'Немедленно эвакуировать существ и закрыть портал. Наблюдателя не отправлять.'
        : 'Немедленно закрыть портал. Наблюдателя не отправлять.';
    case 'high':
      return 'Стабилизировать портал сейчас. Наблюдателя отправлять только после стабилизации.';
    case 'medium':
      return 'Стабилизировать при первой возможности, держать под наблюдением.';
    case 'low':
    default:
      return 'Оставить открытым, плановый обход.';
  }
}
