// Remember scroll positions per view key (e.g. per lesson) so returning to a view restores your place.
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { load, save } from './persist.ts';

export function useScrollMemory(ref: RefObject<HTMLElement>, key: string, storageKey: string) {
  const positions = useRef<Record<string, number>>(load(storageKey, {}));
  const timer = useRef<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el || !key) return;
    const target = positions.current[key] ?? 0;
    // Content (math, PDFs) may lay out after mount; retry briefly until the position is reachable.
    let tries = 0;
    const restore = () => {
      el.scrollTop = target;
      if (Math.abs(el.scrollTop - target) > 2 && tries++ < 10) window.setTimeout(restore, 80);
    };
    const t = window.setTimeout(restore, 30);
    return () => window.clearTimeout(t);
  }, [key, ref]);

  return useCallback(() => {
    const el = ref.current;
    if (!el || !key) return;
    positions.current[key] = el.scrollTop;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const keys = Object.keys(positions.current);
      for (const k of keys.slice(0, Math.max(0, keys.length - 200))) delete positions.current[k];
      save(storageKey, positions.current);
    }, 300);
  }, [key, ref, storageKey]);
}
