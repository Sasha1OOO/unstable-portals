import { useMemo, useState } from 'react';
import type { LogEntry } from '../domain/types';
import { fmtTime } from './format';

const KIND_LABEL: Record<LogEntry['kind'], string> = {
  action: 'действие',
  blocked: 'отклонено',
  system: 'система',
};

type Filter = 'all' | LogEntry['kind'];

export function EventLog({ log }: { log: LogEntry[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const shown = useMemo(
    () => (filter === 'all' ? log : log.filter((e) => e.kind === filter)),
    [log, filter],
  );

  return (
    <div className="panel">
      <h2>Журнал событий ({log.length})</h2>
      <div className="toolbar">
        {(['all', 'action', 'blocked', 'system'] as Filter[]).map((f) => (
          <button
            key={f}
            className={'btn small' + (filter === f ? ' primary' : '')}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'все' : KIND_LABEL[f]}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="hint">Событий нет.</p>
      ) : (
        <div className="log-list">
          {shown.map((e) => (
            <div className={`log-item ${e.kind}`} key={e.id}>
              <time>{fmtTime(e.at)}</time>
              <span className="k">{KIND_LABEL[e.kind]}</span>
              <span>
                <strong>{e.portalName}</strong> — {e.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
