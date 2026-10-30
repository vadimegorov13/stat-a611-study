// localStorage helpers for per-browser UI conveniences (layout, open tabs, scroll positions).
// Anything that matters long-term (notes, progress, scratch work) lives on disk via the API instead.

const PREFIX = 'stat611:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: UI state simply won't persist */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Remove every UI-layout key (used by "Reset layout"). Notes and progress are unaffected. */
export function clearLayoutKeys(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX + 'layout') || k.startsWith('react-resizable-panels')) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
