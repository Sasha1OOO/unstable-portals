import type { Portal } from '../domain/types';
import { fmtTime, riskClass, riskText } from './format';

export function PortalHistory({ portal }: { portal: Portal | null }) {
  if (!portal) {
    return (
      <div className="panel">
        <h2>История изменений портала</h2>
        <p className="hint">Выберите портал в списке — здесь появится история его изменений.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>
        История изменений — {portal.name} ({portal.history.length})
      </h2>
      <div className="scrollbox resize-y history-box">
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
      <p className="hint">Потяните за нижний край блока, чтобы изменить его высоту.</p>
    </div>
  );
}
