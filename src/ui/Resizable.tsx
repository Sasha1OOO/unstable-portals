import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type ResizeHandle = 'n' | 's';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function load(key?: string): number | undefined {
  if (!key) return undefined;
  try {
    const raw = localStorage.getItem(`plab:rz:${key}`);
    const v = raw ? Number(JSON.parse(raw)) : NaN;
    return Number.isFinite(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function save(key: string | undefined, height: number | undefined) {
  if (!key) return;
  try {
    if (height == null) localStorage.removeItem(`plab:rz:${key}`);
    else localStorage.setItem(`plab:rz:${key}`, JSON.stringify(height));
  } catch {
    /* приватный режим / отключённое хранилище — не критично */
  }
}

/**
 * Оборачивает «окно» (панель) и даёт менять его ВЫСОТУ перетаскиванием
 * верхнего (`n`) или нижнего (`s`) края. Двойной клик по полоске — сброс.
 * Значение хранится в localStorage. Ширину колонок двигает отдельный сплиттер.
 */
export function Resizable({
  children,
  className = '',
  handles = ['s'],
  storageKey,
  minHeight = 140,
  defaultHeight,
}: {
  children: ReactNode;
  className?: string;
  handles?: ResizeHandle[];
  storageKey?: string;
  minHeight?: number;
  /** Высота, пока пользователь не задал свою. */
  defaultHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(() => load(storageKey));
  const hRef = useRef(height);
  hRef.current = height;

  const commit = useCallback(
    (next: number | undefined) => {
      setHeight(next);
      save(storageKey, next);
    },
    [storageKey],
  );

  const startDrag = useCallback(
    (dir: ResizeHandle) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const el = ref.current;
      if (!el) return;

      const startY = e.clientY;
      const startH = el.getBoundingClientRect().height;
      document.body.classList.add('rz-dragging');
      document.body.style.cursor = 'ns-resize';

      const onMove = (ev: PointerEvent) => {
        const dy = ev.clientY - startY;
        const next = Math.round(clamp(dir === 's' ? startH + dy : startH - dy, minHeight, 2000));
        hRef.current = next;
        setHeight(next);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        document.body.classList.remove('rz-dragging');
        document.body.style.cursor = '';
        commit(hRef.current);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [commit, minHeight],
  );

  const reset = useCallback(() => commit(undefined), [commit]);

  const style: CSSProperties = {};
  const h = height ?? defaultHeight;
  if (h != null) style.height = h;

  return (
    <div ref={ref} className={`rz ${className}`.trim()} style={style}>
      {children}
      {handles.map((dir) => (
        <span
          key={dir}
          className={`rz-handle rz-${dir}`}
          onPointerDown={startDrag(dir)}
          onDoubleClick={reset}
          title={
            dir === 's'
              ? 'Потяните за нижний край, чтобы изменить высоту. Двойной клик — сброс.'
              : 'Потяните за верхний край, чтобы изменить высоту. Двойной клик — сброс.'
          }
        />
      ))}
    </div>
  );
}
