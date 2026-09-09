import { useCallback, useMemo, useState } from 'react';
import { ACTION_LABEL, canRun } from '../domain/actions';
import type { ActionType, Portal } from '../domain/types';
import { useLab } from '../state/store';
import { EventLog } from './EventLog';
import { PortalDetail } from './PortalDetail';
import { PortalHistory } from './PortalHistory';
import { PortalTable } from './PortalTable';
import { SummaryBar } from './SummaryBar';

interface Toast {
  id: number;
  kind: 'ok' | 'error' | 'info';
  text: string;
}

interface Pending {
  action: ActionType;
  portal: Portal;
  confirm: string;
}

let toastSeq = 0;

export function Dashboard() {
  const { state, dispatch } = useLab();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);

  const selected = useMemo(
    () => state.portals.find((p) => p.id === selectedId) ?? null,
    [state.portals, selectedId],
  );

  const pushToast = useCallback((kind: Toast['kind'], text: string) => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const attempt = useCallback(
    (action: ActionType, portal: Portal) => {
      const guard = canRun(action, portal);
      if (guard.ok === false) {
        dispatch({ type: 'RUN_ACTION', portalId: portal.id, action });
        pushToast('error', `«${ACTION_LABEL[action]}» отклонено: ${guard.reason}`);
        return;
      }
      if (guard.confirm) {
        setPending({ action, portal, confirm: guard.confirm });
        return;
      }
      dispatch({ type: 'RUN_ACTION', portalId: portal.id, action });
      pushToast('ok', `«${ACTION_LABEL[action]}» — выполнено для «${portal.name}».`);
    },
    [dispatch, pushToast],
  );

  const confirmPending = useCallback(() => {
    if (!pending) return;
    dispatch({ type: 'RUN_ACTION', portalId: pending.portal.id, action: pending.action, confirmed: true });
    pushToast('ok', `«${ACTION_LABEL[pending.action]}» — выполнено с подтверждением.`);
    setPending(null);
  }, [pending, dispatch, pushToast]);

  return (
    <>
      <div className="panel">
        <h2>Сценарии и наборы данных</h2>
        <div className="toolbar">
          <button className="btn" onClick={() => dispatch({ type: 'LOAD_SEED' })}>
            Демо-набор порталов
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'LOAD_EMPTY' })}>
            Пустой список
          </button>
          <button className="btn guarded" onClick={() => dispatch({ type: 'ADD_CRITICAL' })}>
            + Портал с критическим риском
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'RESET' })}>
            Сброс к началу смены
          </button>
        </div>
        <p className="hint">
          Кнопки помогают быстро проверить обязательные состояния: пустой список, критический портал,
          запрещённые действия, изменение риска после стабилизации.
        </p>
      </div>

      <SummaryBar portals={state.portals} onPick={setSelectedId} />

      <div className="grid">
        <div className="panel">
          <h2>Порталы ({state.portals.length})</h2>
          <PortalTable portals={state.portals} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="stack">
          <PortalDetail portal={selected} onAttempt={attempt} />
          <PortalHistory portal={selected} />
        </div>
      </div>

      <EventLog log={state.log} />

      {toasts.length > 0 && (
        <div className="toasts">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.kind}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}

      {pending && (
        <div className="modal-backdrop" onClick={() => setPending(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Нужно подтверждение</h3>
            <p>{pending.confirm}</p>
            <div className="row">
              <button className="btn" onClick={() => setPending(null)}>
                Отмена
              </button>
              <button className="btn danger" onClick={confirmPending}>
                Да, {ACTION_LABEL[pending.action].toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
