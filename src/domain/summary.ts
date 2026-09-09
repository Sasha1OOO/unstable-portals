import { computeRisk, RISK_LABEL } from './risk';
import { creatures } from './text';
import type { Portal, RiskLevel } from './types';

export interface LabSummary {
  total: number;
  open: number;
  underReview: number;
  closed: number;
  critical: number;
  withObserver: number;
  byRisk: Record<RiskLevel, number>;
  /** Активные порталы, отсортированные по убыванию риска — «кем заняться в первую очередь». */
  attention: Array<{ portal: Portal; level: RiskLevel; score: number; reason: string }>;
}

const RISK_RANK: Record<RiskLevel, number> = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

export function buildSummary(portals: Portal[]): LabSummary {
  const byRisk: Record<RiskLevel, number> = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let open = 0;
  let underReview = 0;
  let closed = 0;
  let critical = 0;
  let withObserver = 0;

  const attention: LabSummary['attention'] = [];

  for (const portal of portals) {
    const risk = computeRisk(portal);
    byRisk[risk.level] += 1;

    if (portal.status === 'closed') closed += 1;
    else if (portal.status === 'under_review') underReview += 1;
    else open += 1;

    if (portal.hasObserver) withObserver += 1;
    if (risk.level === 'critical') critical += 1;

    if (portal.status !== 'closed' && RISK_RANK[risk.level] >= RISK_RANK.medium) {
      attention.push({
        portal,
        level: risk.level,
        score: risk.score,
        reason: buildReason(portal, risk.level),
      });
    }
  }

  attention.sort(
    (a, b) => RISK_RANK[b.level] - RISK_RANK[a.level] || b.score - a.score,
  );

  return {
    total: portals.length,
    open,
    underReview,
    closed,
    critical,
    withObserver,
    byRisk,
    attention,
  };
}

function buildReason(portal: Portal, level: RiskLevel): string {
  const bits: string[] = [`риск ${RISK_LABEL[level]}`];
  if (portal.minutesToCollapse <= 15) bits.push(`${portal.minutesToCollapse} мин до схлопывания`);
  if (portal.stability < 30) bits.push(`стабильность ${portal.stability}`);
  if (portal.creaturesInside > 0) bits.push(`${creatures(portal.creaturesInside)} внутри`);
  return bits.join(', ');
}
