import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
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
  /** Registers a predicate consulted before every `navigateTo` — return true to
   *  block navigation (mirrors the source's `doohDirty` check inside `onNav`).
   *  Pass `null` to clear. */
  setNavGuard: (guard: (() => boolean) | null) => void;
  /** Route a guarded navigation attempted to reach, or null if none is pending. */
  pendingRoute: string | null;
  /** Resolve a pending guarded navigation: `true` discards the guard and navigates,
   *  `false` cancels the pending navigation and keeps the guard armed. */
  resolvePendingNav: (discard: boolean) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const location = useLocation();
  const navigate = useNavigate();
  const route = location.pathname;

  const guardRef = useRef<(() => boolean) | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const patch = useCallback((updater: Updater) => {
    setState(s => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));
  }, []);

  const setNavGuard = useCallback((guard: (() => boolean) | null) => {
    guardRef.current = guard;
  }, []);

  const commitNavigate = useCallback((r: string) => {
    navigate(r);
    setState(s => ({
      ...s,
      step: 1,
      collapsed: s.tempOpen ? true : s.collapsed,
      tempOpen: false
    }));
  }, [navigate]);

  // Mirrors `onNav`: a dirty guard (e.g. unsaved Network DOOH changes) blocks
  // the navigation and surfaces `pendingRoute` for a confirm dialog instead.
  // Otherwise resets the wizard step and, if the sidebar was only temporarily
  // revealed from a collapsed rail, re-collapses it.
  const navigateTo = useCallback((r: string) => {
    if (guardRef.current && guardRef.current()) {
      setPendingRoute(r);
      return;
    }
    commitNavigate(r);
  }, [commitNavigate]);

  const resolvePendingNav = useCallback((discard: boolean) => {
    const target = pendingRoute;
    setPendingRoute(null);
    if (discard && target != null) {
      guardRef.current = null;
      commitNavigate(target);
    }
  }, [pendingRoute, commitNavigate]);

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
    state, patch, route, navigateTo, onNavGroup, onMainEnter, toggleSidebar,
    setNavGuard, pendingRoute, resolvePendingNav
  }), [state, patch, route, navigateTo, onNavGroup, onMainEnter, toggleSidebar, setNavGuard, pendingRoute, resolvePendingNav]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
