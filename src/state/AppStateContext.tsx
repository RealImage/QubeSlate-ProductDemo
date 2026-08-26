import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type AppState, initialAppState } from './types';

type Updater = Partial<AppState> | ((s: AppState) => Partial<AppState>);

interface AppStateContextValue {
  state: AppState;
  patch: (updater: Updater) => void;
  route: string;
  navigateTo: (route: string) => void;
  onNavGroup: (key: string, route?: string) => void;
  onMainEnter: () => void;
  toggleSidebar: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const location = useLocation();
  const navigate = useNavigate();
  const route = location.pathname;

  const patch = useCallback((updater: Updater) => {
    setState(s => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));
  }, []);

  // Mirrors `onNav`: navigating resets the wizard step and, if the sidebar
  // was only temporarily revealed from a collapsed rail, re-collapses it.
  const navigateTo = useCallback((r: string) => {
    navigate(r);
    setState(s => ({
      ...s,
      step: 1,
      collapsed: s.tempOpen ? true : s.collapsed,
      tempOpen: false
    }));
  }, [navigate]);

  // Mirrors `onNavGroup`: clicking a leaf-route group navigates directly;
  // clicking a parent group toggles its expanded state, and if the rail is
  // collapsed, temporarily reveals it so the sub-items are reachable.
  const onNavGroup = useCallback((key: string, groupRoute?: string) => {
    if (groupRoute) { navigateTo(groupRoute); return; }
    setState(s => {
      const next: Partial<AppState> = {
        open: s.open.indexOf(key) >= 0 && !s.collapsed
          ? s.open.filter(k => k !== key)
          : s.open.concat([key]).filter((k, i, a) => a.indexOf(k) === i)
      };
      if (s.collapsed) { next.collapsed = false; next.tempOpen = true; }
      return { ...s, ...next };
    });
  }, [navigateTo]);

  // Mirrors `onMainEnter`: moving the mouse into the main content area
  // re-collapses a rail that was only temporarily opened.
  const onMainEnter = useCallback(() => {
    setState(s => (s.tempOpen ? { ...s, collapsed: true, tempOpen: false } : s));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(s => ({ ...s, collapsed: !s.collapsed }));
  }, []);

  const value = useMemo<AppStateContextValue>(() => ({
    state, patch, route, navigateTo, onNavGroup, onMainEnter, toggleSidebar
  }), [state, patch, route, navigateTo, onNavGroup, onMainEnter, toggleSidebar]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
