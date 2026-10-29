import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Permission, Portal } from '@slate/domain';
import { can } from '@slate/domain';
import { configureApi, sessionStore, ApiError } from './client';
import { sessionApi } from './endpoints';
import type { Session } from './contracts';

interface SessionContextValue {
  portal: Portal;
  session: Session | null;
  loading: boolean;
  signIn: (userId: string, impersonatorId?: string | null) => void;
  signOut: () => void;
  can: (p: Permission) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2, refetchOnWindowFocus: true },
      mutations: { retry: false }
    }
  });
}

function SessionInner({ portal, children }: { portal: Portal; children: ReactNode }) {
  const qc = useQueryClient();
  const [stored, setStored] = useState(() => sessionStore.get(portal));
  const query = useQuery({ queryKey: ['session', stored?.userId ?? null, stored?.impersonatorId ?? null], queryFn: sessionApi.current, enabled: !!stored });

  const signIn = useCallback((userId: string, impersonatorId: string | null = null) => {
    const next = { userId, impersonatorId };
    sessionStore.set(portal, next);
    qc.clear();
    setStored(next);
  }, [portal, qc]);
  const signOut = useCallback(() => {
    sessionStore.set(portal, null);
    qc.clear();
    setStored(null);
  }, [portal, qc]);

  const session = stored && query.data && query.data.user.portal === portal ? query.data : null;
  const value = useMemo<SessionContextValue>(() => ({
    portal, session, loading: !!stored && query.isLoading, signIn, signOut,
    can: p => !!session && can(session.user.role, p)
  }), [portal, session, stored, query.isLoading, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

const PORTAL_PORTS: Record<Portal, number> = { advertiser: 5173, sac: 5174, admin: 5175 };

/** Base URL of another portal. Override per environment with VITE_<PORTAL>_URL. */
export function portalUrl(portal: Portal): string {
  const env = (import.meta as { env?: Record<string, string> }).env ?? {};
  return env[`VITE_${portal.toUpperCase()}_URL`] ?? `http://localhost:${PORTAL_PORTS[portal]}`;
}

/**
 * Support impersonation link: /?impersonate=<userId>&by=<adminUserId>.
 * Mock only — production must exchange a short-lived signed token from the admin API instead.
 */
function consumeImpersonationLink(portal: Portal) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const userId = url.searchParams.get('impersonate');
  const by = url.searchParams.get('by');
  if (!userId || !by) return;
  sessionStore.set(portal, { userId, impersonatorId: by });
  url.searchParams.delete('impersonate');
  url.searchParams.delete('by');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

/** Wraps a portal: React Query + mock session for that portal. */
export function SlateProvider({ portal, client, children }: { portal: Portal; client?: QueryClient; children: ReactNode }) {
  configureApi(portal);
  useState(() => consumeImpersonationLink(portal));
  const qc = useMemo(() => client ?? createQueryClient(), [client]);
  return (
    <QueryClientProvider client={qc}>
      <SessionInner portal={portal}>{children}</SessionInner>
    </QueryClientProvider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SlateProvider>.');
  return ctx;
}
