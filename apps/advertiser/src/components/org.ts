import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { advertiserApi, useSession } from '@slate/api';
import { toast } from '@slate/ui';

/** Query keys for every advertiser endpoint, so invalidation stays consistent across screens. */
export const qk = {
  dashboard: ['dashboard'] as const,
  company: ['company'] as const,
  brands: ['brands'] as const,
  users: ['users'] as const,
  billing: ['billing'] as const,
  invoices: ['invoices'] as const,
  theatres: ['theatres'] as const,
  doohGroups: ['dooh-groups'] as const,
  targetGroups: ['target-groups'] as const,
  targetGroup: (id: string) => ['target-groups', id] as const,
  media: ['media'] as const,
  campaigns: ['campaigns'] as const,
  campaign: (id: string) => ['campaign', id] as const,
  campaignDelivery: (id: string) => ['campaign', id, 'delivery'] as const
};

/** The signed-in advertiser user, their company and the SAC that sells to them. Only valid inside RequireSession. */
export function useOrg() {
  const { session, can } = useSession();
  if (session?.org.kind !== 'company') throw new Error('An advertiser session is required.');
  return { user: session.user, company: session.org.company, sac: session.org.sac, can };
}

/** Live company record. Seeded from the session so banners render immediately, then refreshed. */
export function useCompany() {
  const { company } = useOrg();
  return useQuery({ queryKey: qk.company, queryFn: advertiserApi.company, initialData: company, initialDataUpdatedAt: 0 });
}

export function errorText(e: unknown, fallback = 'Something went wrong.'): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function notifyError(e: unknown) {
  toast.add({ variant: 'negative', message: errorText(e), timeout: 6000 });
}

export function notifySuccess(message: string) {
  toast.add({ variant: 'positive', message });
}

export function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Today in Asia/Kolkata as YYYY-MM-DD. */
export function todayIst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
