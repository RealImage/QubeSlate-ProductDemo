import type { Role } from './types';

export type Permission =
  | 'company.edit'
  | 'users.manage'
  | 'billing.view'
  | 'campaign.edit'
  | 'campaign.checkout'
  | 'media.edit'
  | 'targets.edit'
  | 'approvals.decide'
  | 'billing.classify'
  | 'inventory.edit'
  | 'tenants.manage'
  | 'gateway.manage'
  | 'catalog.manage'
  | 'impersonate';

// 'viewer' exists in both the advertiser and SAC portals and is read-only in each.
const GRANTS: Record<Role, Permission[]> = {
  admin: ['company.edit', 'users.manage', 'billing.view', 'campaign.edit', 'campaign.checkout', 'media.edit', 'targets.edit'],
  planner: ['campaign.edit', 'media.edit', 'targets.edit'],
  viewer: [],
  sac_admin: ['approvals.decide', 'billing.classify', 'inventory.edit', 'users.manage'],
  ad_ops: ['approvals.decide', 'inventory.edit'],
  finance: ['billing.classify'],
  qube_admin: ['tenants.manage', 'catalog.manage', 'gateway.manage', 'impersonate', 'inventory.edit'],
  qube_support: ['impersonate']
};

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role]?.includes(permission) ?? false;
}
