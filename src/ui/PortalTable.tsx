import { computeRisk } from '../domain/risk';
import type { Portal } from '../domain/types';
import { fmtMinutes, meterColor, riskClass, riskText, STATUS_LABEL } from './format';

export function PortalTable({
  portals,
  selectedId,
  onSelect,
}: {
  portals: Portal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (portals.length === 0) {
    return (
      <div className="empty">
        <div className="big">Список порталов пуст</div>
        <div>Ни один контур не открыт и не под контролем. Загрузите демо-набор или добавьте портал.</div>
      </div>
    );
  }

  return (
    <div className="portals-wrap">
      <table className="portals">
        <colgroup>
          <col className="c-name" />
          <col className="c-world" />
          <col className="c-energy" />
          <col className="c-stab" />
          <col className="c-time" />
          <col className="c-crea" />
          <col className="c-status" />
          <col className="c-risk" />
        </colgroup>
        <thead>
          <tr>
            <th>Портал</th>
            <th>Мир назначения</th>
            <th className="num">Энергия</th>
            <th className="num">Стабильн.</th>
            <th className="num">До схлоп.</th>
            <th className="num">Существа</th>
            <th>Статус</th>
            <th>Риск</th>
          </tr>
        </thead>
        <tbody>
          {portals.map((p) => {
            const risk = computeRisk(p);
            return (
              <tr
                key={p.id}
                className={p.id === selectedId ? 'selected' : ''}
                onClick={() => onSelect(p.id)}
              >
                <td>
                  {p.name}
                  {p.hasObserver && <span title="наблюдатель на месте"> 👁</span>}
                </td>
                <td>{p.destinationWorld}</td>
                <td className="num">
                  {p.energy}
                  <div className="meter">
                    <span style={{ width: `${p.energy}%`, background: meterColor(p.energy) }} />
                  </div>
                </td>
                <td className="num">
                  {p.stability}
                  <div className="meter">
                    <span
                      style={{ width: `${p.stability}%`, background: meterColor(p.stability, true) }}
                    />
                  </div>
                </td>
                <td className="num">{p.status === 'closed' ? '—' : fmtMinutes(p.minutesToCollapse)}</td>
                <td className="num">{p.creaturesInside}</td>
                <td>
                  <span className={`status-tag ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </td>
                <td>
                  <span className={riskClass(risk.level)}>{riskText(risk.level)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
