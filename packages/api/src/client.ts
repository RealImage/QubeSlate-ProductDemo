import type { Portal } from '@slate/domain';

/** Who the browser is acting as. Mock auth: the API trusts these headers. Real SSO replaces this module. */
export interface StoredSession {
  userId: string;
  /** Qube admin user id when impersonating. */
  impersonatorId: string | null;
}

const key = (portal: Portal) => `slate.session.${portal}`;

export const sessionStore = {
  get(portal: Portal): StoredSession | null {
    try {
      const raw = localStorage.getItem(key(portal));
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },
  set(portal: Portal, s: StoredSession | null) {
    try {
      if (s) localStorage.setItem(key(portal), JSON.stringify(s));
      else localStorage.removeItem(key(portal));
    } catch {
      /* private mode: session lasts for the tab only */
    }
  }
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let currentPortal: Portal = 'advertiser';
const base = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? '';

export function configureApi(portal: Portal) {
  currentPortal = portal;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const s = sessionStore.get(currentPortal);
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (s) {
    headers['x-slate-user'] = s.userId;
    if (s.impersonatorId) headers['x-slate-impersonator'] = s.impersonatorId;
  }
  const res = await fetch(base + '/api' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Request failed.');
  return data as T;
}

export const http = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  put: <T>(p: string, b: unknown) => request<T>('PUT', p, b),
  patch: <T>(p: string, b: unknown) => request<T>('PATCH', p, b),
  del: <T = void>(p: string) => request<T>('DELETE', p)
};
