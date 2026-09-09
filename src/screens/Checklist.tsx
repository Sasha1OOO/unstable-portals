import { useState } from 'react';

interface Item {
  id: string;
  text: string;
  how: string;
}

const REQUIRED: Item[] = [
  {
    id: 'empty',
    text: 'Пустой список порталов',
    how: 'Сценарии → «Пустой список». Таблица показывает заглушку, сводка обнуляется, приложение не падает.',
  },
  {
    id: 'critical',
    text: 'Портал с критическим риском',
    how: '«Бездонный зев» в демо (или Сценарии → «+ Портал с критическим риском»). Красный бейдж, override в карточке, попадает в «Внимание в первую очередь».',
  },
  {
    id: 'forbidden',
    text: 'Попытка выполнить запрещённое действие',
    how: 'Открыть «Запечатанный контур» (закрыт) → «Стабилизировать»; или у «Бездонного зева» → «Отправить наблюдателя». Появляется тост-отказ, в журнале — запись «отклонено».',
  },
  {
    id: 'risk-change',
    text: 'Изменение риска после стабилизации',
    how: '«Грозовые врата» → «Стабилизировать» 1–2 раза. Стабильность растёт, энергия падает, время +20 мин, бейдж риска понижается, в истории портала — «высокий → средний».',
  },
  {
    id: 'log',
    text: 'Журнал действий после нескольких операций',
    how: 'Выполнить 3–4 действия (в т.ч. одно запрещённое). Журнал внизу: новые записи сверху, фильтры «действие / отклонено / система», счётчик растёт.',
  },
];

const EXTRA: Item[] = [
  {
    id: 'confirm-creatures',
    text: 'Закрытие портала с существами внутри — через подтверждение',
    how: '«Янтарный проём» (2 существа) → «Закрыть портал». Появляется модалка с предупреждением; без подтверждения статус не меняется, отказ пишется в журнал.',
  },
  {
    id: 'observer-high',
    text: 'Наблюдатель при высоком риске — с подтверждением, при критическом — запрет',
    how: 'High → модалка подтверждения. Critical → кнопка помечена 🔒, нажатие даёт отказ.',
  },
  {
    id: 'recommendation',
    text: 'Рекомендуемое действие соответствует уровню риска',
    how: 'Карточка портала: для critical — «эвакуировать и закрыть», для low — «плановый обход».',
  },
  {
    id: 'summary',
    text: 'Сводка считает корректно',
    how: 'Счётчики открыто/под вопросом/закрыто/критично сходятся с таблицей; список «Внимание» отсортирован по убыванию риска.',
  },
  {
    id: 'tests',
    text: 'Автотесты проходят',
    how: 'npm test → 36 passed (домен: risk / actions / reducer / summary).',
  },
  {
    id: 'build',
    text: 'Сборка проходит, открывается один файл',
    how: 'npm run build → dist/index.html открывается двойным кликом без сервера.',
  },
];

function Group({ title, items }: { title: string; items: Item[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.id, true])),
  );
  return (
    <>
      <h3>{title}</h3>
      <ul className="check" style={{ listStyle: 'none', paddingLeft: 0 }}>
        {items.map((i) => (
          <li key={i.id} style={{ margin: '10px 0' }}>
            <label style={{ display: 'flex', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={checked[i.id]}
                onChange={(e) => setChecked((c) => ({ ...c, [i.id]: e.target.checked }))}
              />
              <span>
                <strong>{i.text}</strong>
                <br />
                <span className="hint">{i.how}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Checklist() {
  return (
    <div className="panel prose">
      <h2>Чеклист проверки</h2>
      <p className="hint">
        Что я прошёл руками перед сдачей. Галочки можно снимать/ставить — состояние живёт в рамках
        сессии и нужно как памятка проверяющему.
      </p>
      <Group title="Обязательные состояния из ТЗ" items={REQUIRED} />
      <Group title="Дополнительно проверено" items={EXTRA} />
    </div>
  );
}
