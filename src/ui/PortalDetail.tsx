import { ACTION_LABEL, canRun } from '../domain/actions';
import { computeRisk, recommendedAction, RISK_WEIGHTS } from '../domain/risk';
import type { ActionType, Portal } from '../domain/types';
import { fmtMinutes, fmtTime, riskClass, riskText, STATUS_LABEL } from './format';

const ACTION_ORDER: ActionType[] = ['stabilize', 'send_observer', 'mark_review', 'clear_review', 'close'];

export function PortalDetail({
  portal,
  onAttempt,
}: {
  portal: Portal | null;
  onAttempt: (action: ActionType, portal: Portal) => void;
}) {
  if (!portal) {
    return (
      <div className="panel">
        <h2>Карточка портала</h2>
        <p className="hint">Выберите портал в списке слева, чтобы увидеть риски, историю и доступные действия.</p>
      </div>
    );
  }

  const risk = computeRisk(portal);
  const weightsPct = {
    instability: Math.round(RISK_WEIGHTS.instability * 100),
    energy: Math.round(RISK_WEIGHTS.energy * 100),
    time: Math.round(RISK_WEIGHTS.time * 100),
    creatures: Math.round(RISK_WEIGHTS.creatures * 100),
  };

  return (
    <div className="panel detail">
      <h2>
        {portal.name} <span className={riskClass(risk.level)}>{riskText(risk.level)}</span>
      </h2>

      <dl>
        <dt>Мир назначения</dt>
        <dd>{portal.destinationWorld}</dd>
        <dt>Статус</dt>
        <dd>{STATUS_LABEL[portal.status]}</dd>
        <dt>Энергия</dt>
        <dd>{portal.energy} / 100</dd>
        <dt>Стабильность</dt>
        <dd>{portal.stability} / 100</dd>
        <dt>До схлопывания</dt>
        <dd>{portal.status === 'closed' ? '—' : fmtMinutes(portal.minutesToCollapse)}</dd>
        <dt>Существ внутри</dt>
        <dd>{portal.creaturesInside}</dd>
        <dt>Наблюдатель</dt>
        <dd>{portal.hasObserver ? 'на месте' : 'нет'}</dd>
      </dl>

      <h3>Риск и как он посчитан</h3>
      {portal.status === 'closed' ? (
        <p className="hint">Портал закрыт — риска не несёт.</p>
      ) : (
        <div className="formula">
          <table>
            <tbody>
              <tr>
                <td>Нестабильность (100 − {portal.stability})</td>
                <td>
                  {Math.round(risk.parts[0].raw)} × {weightsPct.instability}%
                </td>
                <td>{risk.parts[0].contribution.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Энергия</td>
                <td>
                  {Math.round(risk.parts[1].raw)} × {weightsPct.energy}%
                </td>
                <td>{risk.parts[1].contribution.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Дефицит времени ({portal.minutesToCollapse} мин)</td>
                <td>
                  {Math.round(risk.parts[2].raw)} × {weightsPct.time}%
                </td>
                <td>{risk.parts[2].contribution.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Существа внутри ({portal.creaturesInside})</td>
                <td>
                  {Math.round(risk.parts[3].raw)} × {weightsPct.creatures}%
                </td>
                <td>{risk.parts[3].contribution.toFixed(1)}</td>
              </tr>
              <tr className="total">
                <td>Итоговый счёт риска</td>
                <td />
                <td>
                  {risk.score.toFixed(1)} / 100 → {riskText(risk.level)}
                </td>
              </tr>
            </tbody>
          </table>
          {risk.overrides.length > 0 && (
            <div className="ovr" style={{ marginTop: 8 }}>
              {risk.overrides.map((o) => (
                <div key={o}>⚠ {o}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <h3>Рекомендуемое действие</h3>
      <div className="rec">{recommendedAction(portal)}</div>

      <h3>Действия</h3>
      <div className="actions-row">
        {ACTION_ORDER.map((action) => {
          if (action === 'clear_review' && portal.status !== 'under_review') return null;
          if (action === 'mark_review' && portal.status === 'under_review') return null;
          const guard = canRun(action, portal);
          const blocked = guard.ok === false;
          const needsConfirm = guard.ok === true && !!guard.confirm;
          const cls =
            'btn small' +
            (action === 'close' ? ' danger' : '') +
            (blocked || needsConfirm ? ' guarded' : '') +
            (action === 'stabilize' && !blocked ? ' primary' : '');
          return (
            <div key={action}>
              <button
                className={cls}
                onClick={() => onAttempt(action, portal)}
                title={blocked ? guard.reason : needsConfirm ? guard.confirm : ''}
              >
                {blocked ? '🔒 ' : needsConfirm ? '⚠ ' : ''}
                {ACTION_LABEL[action]}
              </button>
              {blocked && <div className="reason">{guard.reason}</div>}
            </div>
          );
        })}
      </div>
      <p className="hint">
        🔒 — действие запрещено (нелогичное состояние), при попытке фиксируется в журнале. ⚠ — нужно подтверждение.
      </p>

      <h3>История изменений портала</h3>
      <div className="history-list">
        {portal.history.map((h) => (
          <div className="history-item" key={h.id}>
            <time>{fmtTime(h.at)}</time>
            <span>
              {h.message}
              {h.riskBefore && h.riskAfter && h.riskBefore !== h.riskAfter && (
                <>
                  {' '}
                  <span className={riskClass(h.riskBefore)}>{riskText(h.riskBefore)}</span> →{' '}
                  <span className={riskClass(h.riskAfter)}>{riskText(h.riskAfter)}</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
