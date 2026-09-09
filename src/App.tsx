import { useState } from 'react';
import { Dashboard } from './ui/Dashboard';
import { Checklist } from './screens/Checklist';
import { Worklog } from './screens/Worklog';

type Tab = 'dashboard' | 'worklog' | 'checklist';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Панель смотрителя' },
  { id: 'worklog', label: 'AI Worklog' },
  { id: 'checklist', label: 'Чеклист' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="app">
      <header className="top">
        <h1>Лаборатория нестабильных порталов</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'worklog' && <Worklog />}
      {tab === 'checklist' && <Checklist />}
    </div>
  );
}
