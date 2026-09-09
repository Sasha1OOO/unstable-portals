import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type ResizeHandle = 'e' | 's' | 'se';

interface UserSize {
  width?: number;
  height?: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function load(key?: string): UserSize {
  if (!key) return {};
  try {
    const raw = localStorage.getItem(`plab:rz:${key}`);
    return raw ? (JSON.parse(raw) as UserSize) : {};
  } catch {
    return {};
  }
}

function save(key: string | undefined, size: UserSize) {
  if (!key) return;
  try {
    localStorage.setItem(`plab:rz:${key}`, JSON.stringify(size));
  } catch {
    /* приватный режим / отключённое хранилище — не критично */
  }
}

/**
 * Оборачивает «окно» (панель) и даёт менять его размер перетаскиванием рамок.
 * Тянуть можно за правый край (ширина), нижний край (высота) и правый нижний угол.
 * Двойной клик по рамке — сброс к размеру по умолчанию.
 */
export function Resizable({
  children,
  className = '',
  handles = ['s'],
  storageKey,
  minWidth = 300,
  minHeight = 160,
  defaultHeight,
}: {
  children: ReactNode;
  className?: string;
  handles?: ResizeHandle[];
  storageKey?: string;
  minWidth?: number;
  minHeight?: number;
  /** Высота, пока пользователь не задал свою (напр. «как правая колонка»). */
  defaultHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<UserSize>(() => load(storageKey));
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const commit = useCallback(
    (next: UserSize) => {
      setSize(next);
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

      const rect = el.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = rect.width;
      const startH = rect.height;
      const maxWidth = el.parentElement ? el.parentElement.clientWidth : Number.MAX_SAFE_INTEGER;

      document.body.classList.add('rz-dragging');
      document.body.style.cursor =
        dir === 'e' ? 'ew-resize' : dir === 's' ? 'ns-resize' : 'nwse-resize';

      const onMove = (ev: PointerEvent) => {
        const next: UserSize = { ...sizeRef.current };
        if (dir === 'e' || dir === 'se') {
          next.width = Math.round(clamp(startW + (ev.clientX - startX), minWidth, maxWidth));
        }
        if (dir === 's' || dir === 'se') {
          next.height = Math.round(Math.max(minHeight, startH + (ev.clientY - startY)));
        }
        sizeRef.current = next;
        setSize(next);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        document.body.classList.remove('rz-dragging');
        document.body.style.cursor = '';
        commit(sizeRef.current);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [commit, minWidth, minHeight],
  );

  const reset = useCallback(
    (dir: ResizeHandle) => () => {
      const next: UserSize = { ...sizeRef.current };
      if (dir === 'e' || dir === 'se') delete next.width;
      if (dir === 's' || dir === 'se') delete next.height;
      commit(next);
    },
    [commit],
  );

  // Сброс сохранённого размера, если ключ поменялся динамически (не используется, но безопасно).
  useEffect(() => {
    setSize(load(storageKey));
  }, [storageKey]);

  const style: CSSProperties = {};
  if (size.width != null) {
    style.width = size.width;
    style.flex = '0 0 auto';
  }
  const h = size.height ?? defaultHeight;
  if (h != null) style.height = h;

  return (
    <div ref={ref} className={`rz ${className}`.trim()} style={style}>
      {children}
      {handles.includes('e') && (
        <span
          className="rz-handle rz-e"
          onPointerDown={startDrag('e')}
          onDoubleClick={reset('e')}
          title="Потяните, чтобы изменить ширину. Двойной клик — сброс."
        />
      )}
      {handles.includes('s') && (
        <span
          className="rz-handle rz-s"
          onPointerDown={startDrag('s')}
          onDoubleClick={reset('s')}
          title="Потяните, чтобы изменить высоту. Двойной клик — сброс."
        />
      )}
      {handles.includes('se') && (
        <span
          className="rz-handle rz-se"
          onPointerDown={startDrag('se')}
          onDoubleClick={reset('se')}
          title="Потяните, чтобы изменить размер. Двойной клик — сброс."
        />
      )}
    </div>
  );
}
