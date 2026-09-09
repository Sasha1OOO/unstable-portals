import { buildSummary } from '../domain/summary';
import type { Portal } from '../domain/types';
import { riskClass, riskText } from './format';

export function SummaryBar({
  portals,
  onPick,
}: {
  portals: Portal[];
  onPick: (portalId: string) => void;
}) {
  const s = buildSummary(portals);

  return (
    <div className="panel">
      <h2>Итоговая сводка</h2>
      <div className="summary-cards">
        <div className="card">
          <div className="n">{s.total}</div>
          <div className="l">всего порталов</div>
        </div>
        <div className="card">
          <div className="n">{s.open}</div>
          <div className="l">открыто</div>
        </div>
        <div className="card">
          <div className="n">{s.underReview}</div>
          <div className="l">под вопросом</div>
        </div>
        <div className="card">
          <div className="n">{s.closed}</div>
          <div className="l">закрыто</div>
        </div>
        <div className={'card' + (s.critical ? ' alarm' : '')}>
          <div className="n">{s.critical}</div>
          <div className="l">критический риск</div>
        </div>
        <div className="card">
          <div className="n">{s.withObserver}</div>
          <div className="l">с наблюдателем</div>
        </div>
      </div>

      <h3>Внимание в первую очередь</h3>
      {s.attention.length === 0 ? (
        <p className="hint">Порталов со средним и выше риском нет — можно выдохнуть.</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {s.attention.map((a) => (
            <li key={a.portal.id} style={{ margin: '4px 0' }}>
              <button className="btn small" onClick={() => onPick(a.portal.id)}>
                {a.portal.name}
              </button>{' '}
              <span className={riskClass(a.level)}>{riskText(a.level)}</span>{' '}
              <span className="hint">{a.reason}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
