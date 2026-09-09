import { RISK_LABEL } from '../domain/risk';
import type { PortalStatus, RiskLevel } from '../domain/types';

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function fmtMinutes(min: number): string {
  if (min <= 0) return '0 мин';
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export const STATUS_LABEL: Record<PortalStatus, string> = {
  open: 'открыт',
  under_review: 'под вопросом',
  closed: 'закрыт',
};

export function riskClass(level: RiskLevel): string {
  return `badge risk-${level}`;
}

export function riskText(level: RiskLevel): string {
  return RISK_LABEL[level];
}

export function meterColor(value: number, invert = false): string {
  const v = invert ? 100 - value : value;
  if (v >= 66) return 'var(--risk-critical)';
  if (v >= 33) return 'var(--risk-medium)';
  return 'var(--risk-low)';
}
