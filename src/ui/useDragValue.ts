import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * Числовое значение (размер панели/колонки), которое пользователь меняет
 * перетаскиванием, с сохранением в localStorage и сбросом по двойному клику.
 */
export function useDragValue(storageKey: string) {
  const [value, setValue] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
    } catch {
      return null;
    }
  });
  const ref = useRef(value);
  ref.current = value;

  const beginDrag = useCallback(
    (opts: {
      axis: 'x' | 'y';
      start: number;
      compute: (start: number, delta: number) => number;
      cursor?: string;
    }) =>
      (e: ReactPointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const origin = opts.axis === 'x' ? e.clientX : e.clientY;
        document.body.classList.add('rz-dragging');
        document.body.style.cursor = opts.cursor ?? (opts.axis === 'x' ? 'ew-resize' : 'ns-resize');

        const move = (ev: PointerEvent) => {
          const now = opts.axis === 'x' ? ev.clientX : ev.clientY;
          const next = Math.round(opts.compute(opts.start, now - origin));
          ref.current = next;
          setValue(next);
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          document.body.classList.remove('rz-dragging');
          document.body.style.cursor = '';
          try {
            if (ref.current == null) localStorage.removeItem(storageKey);
            else localStorage.setItem(storageKey, String(ref.current));
          } catch {
            /* хранилище недоступно — не критично */
          }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      },
    [storageKey],
  );

  const reset = useCallback(() => {
    setValue(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return { value, beginDrag, reset };
}
