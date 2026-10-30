import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { type AppState, initialAppState } from './types';

type Updater = Partial<AppState> | ((s: AppState) => Partial<AppState>);

interface AppStateContextValue {
  state: AppState;
  patch: (updater: Updater) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

/** Holds local state for pages still on mock data. API-backed screens use React Query. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const patch = useCallback((updater: Updater) => {
    setState(s => ({ ...s, ...(typeof updater === 'function' ? updater(s) : updater) }));
  }, []);
  const value = useMemo<AppStateContextValue>(() => ({ state, patch }), [state, patch]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
