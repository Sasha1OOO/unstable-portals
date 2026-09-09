import type { Portal } from './types';

/** Детерминированные стартовые данные лаборатории (для демо и тестов). */
export function seedPortals(): Portal[] {
  return [
    mk({
      id: 'p-emerald',
      name: 'Изумрудная арка',
      destinationWorld: 'Лес Тихого Света',
      energy: 22,
      stability: 88,
      minutesToCollapse: 540,
      creaturesInside: 0,
      status: 'open',
    }),
    mk({
      id: 'p-amber',
      name: 'Янтарный проём',
      destinationWorld: 'Пустоши Кальдеры',
      energy: 58,
      stability: 61,
      minutesToCollapse: 180,
      creaturesInside: 2,
      status: 'open',
    }),
    mk({
      id: 'p-storm',
      name: 'Грозовые врата',
      destinationWorld: 'Небесный Разлом',
      energy: 76,
      stability: 34,
      minutesToCollapse: 45,
      creaturesInside: 1,
      status: 'open',
      hasObserver: true,
    }),
    mk({
      id: 'p-abyss',
      name: 'Бездонный зев',
      destinationWorld: 'Мгла Нижних Ярусов',
      energy: 94,
      stability: 9,
      minutesToCollapse: 12,
      creaturesInside: 4,
      status: 'open',
    }),
    mk({
      id: 'p-quiet',
      name: 'Тихая калитка',
      destinationWorld: 'Луговина Мирного Дня',
      energy: 40,
      stability: 55,
      minutesToCollapse: 300,
      creaturesInside: 0,
      status: 'under_review',
    }),
    mk({
      id: 'p-sealed',
      name: 'Запечатанный контур',
      destinationWorld: 'Стеклянная Пустыня',
      energy: 0,
      stability: 100,
      minutesToCollapse: 0,
      creaturesInside: 0,
      status: 'closed',
    }),
  ];
}

/** Одиночный критический портал — для сценария «портал с критическим риском». */
export function criticalPortal(id = `p-crit-${Date.now()}`): Portal {
  return mk({
    id,
    name: 'Раскалённая трещина',
    destinationWorld: 'Ядро Обугленного Мира',
    energy: 97,
    stability: 6,
    minutesToCollapse: 8,
    creaturesInside: 3,
    status: 'open',
  });
}

function mk(p: Omit<Portal, 'hasObserver' | 'history'> & Partial<Pick<Portal, 'hasObserver'>>): Portal {
  return {
    hasObserver: false,
    history: [
      {
        id: `${p.id}-h0`,
        at: new Date('2026-09-09T08:00:00Z').toISOString(),
        message: 'Портал зарегистрирован в журнале лаборатории.',
      },
    ],
    ...p,
  };
}
