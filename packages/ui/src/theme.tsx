import { useSyncExternalStore } from 'react';

/** What the user picked. `system` follows the OS setting and changes with it. */
export type ThemePreference = 'light' | 'dark' | 'system';

const KEY = 'slate.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

let preference: ThemePreference = typeof window === 'undefined' ? 'system' : read();

const resolve = (p: ThemePreference): 'light' | 'dark' =>
  p === 'system' ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light') : p;

/** Sets `data-theme` on <html>; styles.css keys the dark token set off it. */
function apply() {
  const root = document.documentElement;
  const theme = resolve(preference);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function setThemePreference(p: ThemePreference) {
  preference = p;
  try {
    if (p === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, p);
  } catch { /* storage blocked: the choice lasts for this page only */ }
  apply();
  listeners.forEach(l => l());
}

// Runs when @slate/ui is first imported, before the app renders, so the first paint is already in the right theme.
if (typeof window !== 'undefined') {
  apply();
  window.matchMedia(DARK_QUERY).addEventListener('change', () => { if (preference === 'system') apply(); });
  // Another tab of the same portal changed the setting.
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    preference = read();
    apply();
    listeners.forEach(l => l());
  });
}

export function useThemePreference(): [ThemePreference, (p: ThemePreference) => void] {
  const p = useSyncExternalStore(
    l => { listeners.add(l); return () => listeners.delete(l); },
    () => preference,
    () => 'system' as const
  );
  return [p, setThemePreference];
}
