import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ACTION_LABEL, canRun } from '../domain/actions';
import type { ActionType, Portal } from '../domain/types';
import { useLab } from '../state/store';
import { EventLog } from './EventLog';
import { PortalDetail } from './PortalDetail';
import { PortalHistory } from './PortalHistory';
import { PortalTable } from './PortalTable';
import { Resizable } from './Resizable';
import { SummaryBar } from './SummaryBar';
import { useDragValue } from './useDragValue';

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
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export function Dashboard() {
  const { state, dispatch } = useLab();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);

  const selected = useMemo(
    () => state.portals.find((p) => p.id === selectedId) ?? null,
    [state.portals, selectedId],
  );

  // ── Резайз раскладки ────────────────────────────────────────────────
  const gridRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const col = useDragValue('plab:col'); // ширина правой колонки
  const rightH = useDragValue('plab:rightH'); // высота правой колонки (список тянется следом)
  const split = useDragValue('plab:split'); // высота карточки внутри правой колонки

  // одна и та же полоса: правый край списка и левый край карточки/истории
  const startCol = useCallback(
    (e: ReactPointerEvent) => {
      const grid = gridRef.current;
      const stack = stackRef.current;
      if (!grid || !stack) return;
      const gw = grid.clientWidth;
      col.beginDrag({
        axis: 'x',
        start: stack.getBoundingClientRect().width,
        compute: (start, dx) => clamp(start - dx, 340, gw - 340),
      })(e);
    },
    [col],
  );

  // нижний край правой колонки — общая высота (список подстраивается)
  const startRightH = useCallback(
    (e: ReactPointerEvent) => {
      const stack = stackRef.current;
      if (!stack) return;
      rightH.beginDrag({
        axis: 'y',
        start: stack.getBoundingClientRect().height,
        compute: (start, dy) => clamp(start + dy, 320, 1800),
      })(e);
    },
    [rightH],
  );

  // одна полоса между карточкой и историей — делит высоту между ними
  const startSplit = useCallback(
    (e: ReactPointerEvent) => {
      const detail = detailRef.current;
      const stack = stackRef.current;
      if (!detail || !stack) return;
      const maxDetail = stack.clientHeight - 140;
      split.beginDrag({
        axis: 'y',
        start: detail.getBoundingClientRect().height,
        compute: (start, dy) => clamp(start + dy, 140, Math.max(160, maxDetail)),
      })(e);
    },
    [split],
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

  const colTitle = 'Потяните, чтобы изменить ширину колонок. Двойной клик — сброс.';

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

      <p className="hint rz-tip">
        Раскладку можно перекраивать за полосы-разделители: между колонками — ширина; между карточкой
        портала и историей — как поделить высоту; нижний край списка или правой колонки — их общая
        высота; нижний край журнала — высота журнала. Двойной клик по полосе — сброс.
      </p>

      <div
        className="grid"
        ref={gridRef}
        style={col.value != null ? { gridTemplateColumns: `minmax(320px, 1fr) ${col.value}px` } : undefined}
      >
        <div className="rz rz-list">
          <div className="panel">
            <h2>Порталы ({state.portals.length})</h2>
            <PortalTable portals={state.portals} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <span
            className="rz-handle rz-s rz-list-s"
            onPointerDown={startRightH}
            onDoubleClick={rightH.reset}
            title="Потяните за нижний край, чтобы изменить высоту (общую для списка и правой колонки). Двойной клик — сброс."
          />
        </div>

        <div
          className="stack"
          ref={stackRef}
          style={rightH.value != null ? { height: rightH.value } : undefined}
        >
          {/* одна общая полоса на границе списка и правой колонки */}
          <span
            className="col-split"
            onPointerDown={startCol}
            onDoubleClick={col.reset}
            title={colTitle}
          />

          <div
            className="rz rz-detail"
            ref={detailRef}
            style={split.value != null ? { flex: `0 0 ${split.value}px` } : undefined}
          >
            <PortalDetail portal={selected} onAttempt={attempt} />
          </div>

          <span
            className="rz-split"
            onPointerDown={startSplit}
            onDoubleClick={split.reset}
            title="Потяните, чтобы поделить высоту между карточкой портала и историей. Двойной клик — сброс."
          />

          <div className="rz rz-history">
            <PortalHistory portal={selected} />
          </div>

          <span
            className="rz-handle rz-s rz-stack-s"
            onPointerDown={startRightH}
            onDoubleClick={rightH.reset}
            title="Потяните за нижний край, чтобы изменить высоту правой колонки. Двойной клик — сброс."
          />
        </div>
      </div>

      <Resizable className="rz-log" handles={['s']} storageKey="log" minHeight={140}>
        <EventLog log={state.log} />
      </Resizable>

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
