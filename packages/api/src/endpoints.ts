import type {
  AuditEvent, Brand, CategoryNode, Company, Exhibitor, Media, Theatre, DoohGroup, User, PlacementAction, KycDoc
} from '@slate/domain';
import { http } from './client';
import type * as C from './contracts';

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return s ? '?' + s : '';
};

export const sessionApi = {
  demoAccounts: () => http.get<C.DemoAccount[]>('/demo-accounts'),
  current: () => http.get<C.Session>('/session'),
  /** Public: the SAC behind a registration link. */
  sacBySubdomain: (subdomain: string) => http.get<C.PublicSac>(`/sacs/${encodeURIComponent(subdomain)}`),
  signup: (b: { sacSubdomain: string; companyName: string; gstin: string; pan: string; address: string; name: string; email: string; phone: string }) =>
    http.post<{ userId: string }>('/signup', b),
  reset: () => http.post('/_reset')
};

export const advertiserApi = {
  dashboard: () => http.get<C.Dashboard>('/dashboard'),
  company: () => http.get<Company>('/company'),
  updateCompany: (b: Partial<Pick<Company, 'name' | 'gstin' | 'pan' | 'address' | 'contacts'>>) => http.put<Company>('/company', b),
  uploadKycDoc: (kind: KycDoc['kind'], fileName: string) => http.post<Company>('/company/kyc-docs', { kind, fileName }),
  submitKyc: () => http.post<Company>('/company/submit-kyc'),
  brands: () => http.get<C.BrandView[]>('/brands'),
  requestBrand: (b: { name: string; categoryIds: string[] }) => http.post<C.BrandView>('/brands', b),
  theatres: () => http.get<Theatre[]>('/inventory/theatres'),
  doohGroups: () => http.get<DoohGroup[]>('/inventory/dooh-groups'),

  targetGroups: () => http.get<C.TargetGroupWithReach[]>('/target-groups'),
  targetGroup: (id: string) => http.get<C.TargetGroupWithReach>(`/target-groups/${id}`),
  previewReach: (b: C.TargetGroupInput) => http.post<C.ReachPreview>('/target-groups/preview', b),
  createTargetGroup: (b: C.TargetGroupInput) => http.post<C.TargetGroupWithReach>('/target-groups', b),
  updateTargetGroup: (id: string, b: C.TargetGroupInput) => http.put<C.TargetGroupWithReach>(`/target-groups/${id}`, b),
  deleteTargetGroup: (id: string) => http.del(`/target-groups/${id}`),

  media: () => http.get<Media[]>('/media'),
  createMedia: (b: C.MediaInput) => http.post<Media>('/media', b),
  deleteMedia: (id: string) => http.del(`/media/${id}`),

  campaigns: () => http.get<C.CampaignRow[]>('/campaigns'),
  campaign: (id: string) => http.get<C.CampaignDetail>(`/campaigns/${id}`),
  createCampaign: (b: C.CampaignInput) => http.post<C.CampaignDetail>('/campaigns', b),
  updateCampaign: (id: string, b: C.CampaignInput) => http.put<C.CampaignDetail>(`/campaigns/${id}`, b),
  deleteCampaign: (id: string) => http.del(`/campaigns/${id}`),
  quotePlacement: (id: string, b: C.PlacementInput) => http.post<C.PlacementQuoteResponse>(`/campaigns/${id}/quote`, b),
  addPlacement: (id: string, b: C.PlacementInput) => http.post<C.CampaignDetail>(`/campaigns/${id}/placements`, b),
  placementAction: (placementId: string, action: PlacementAction) => http.patch<C.CampaignDetail>(`/placements/${placementId}`, { action }),
  checkout: (id: string, b: C.CheckoutInput) => http.post<C.CampaignDetail>(`/campaigns/${id}/checkout`, b),
  submit: (id: string) => http.post<C.CampaignDetail>(`/campaigns/${id}/submit`),
  campaignDelivery: (id: string) => http.get<C.DeliveryBreakdown>(`/campaigns/${id}/delivery`),
  placementDelivery: (placementId: string) => http.get<C.DeliveryBreakdown>(`/placements/${placementId}/delivery`),

  billing: () => http.get<C.BillingOverview>('/billing'),
  invoices: () => http.get<C.InvoiceRow[]>('/invoices')
};

/** Same endpoints in every portal; scoped by the signed-in user's organisation. */
export const usersApi = {
  list: () => http.get<User[]>('/users'),
  invite: (b: C.UserInput) => http.post<User>('/users', b),
  /** Email is immutable; invite the new address instead. */
  update: (id: string, b: Partial<Omit<C.UserInput, 'email'> & { status: User['status'] }>) => http.put<User>(`/users/${id}`, b),
  remove: (id: string) => http.del(`/users/${id}`)
};

export interface SacDashboard {
  activeCampaigns: number;
  pendingCampaigns: number;
  pendingKyc: number;
  pendingBrands: number;
  theatres: number;
  screens: number;
  bookedValue: number;
  delivery: { planned: number; played: number; failed: number; rate: number };
  recent: C.CampaignRow[];
}

export const sacApi = {
  dashboard: () => http.get<SacDashboard>('/sac/dashboard'),
  advertisers: () => http.get<C.AdvertiserRow[]>('/sac/advertisers'),
  advertiser: (id: string) => http.get<C.AdvertiserRow>(`/sac/advertisers/${id}`),
  decideKyc: (id: string, b: C.KycDecisionInput) => http.post<C.AdvertiserRow>(`/sac/advertisers/${id}/kyc-decision`, b),
  setTerms: (id: string, b: C.AdvertiserTermsInput) => http.put<C.AdvertiserRow>(`/sac/advertisers/${id}/terms`, b),
  brands: () => http.get<C.BrandRow[]>('/sac/brands'),
  decideBrand: (id: string, b: { decision: 'approve' | 'reject'; note: string | null }) => http.post<Brand>(`/sac/brands/${id}/decision`, b),
  campaigns: () => http.get<C.CampaignRow[]>('/sac/campaigns'),
  campaign: (id: string) => http.get<C.CampaignDetail>(`/sac/campaigns/${id}`),
  decideCampaign: (id: string, b: C.DecisionInput) => http.post<C.CampaignDetail>(`/sac/campaigns/${id}/decision`, b),
  theatres: () => http.get<C.TheatreRow[]>('/sac/theatres'),
  saveDooh: (theatreId: string, b: C.DoohConfigInput) => http.put<Theatre & { doohGroups: DoohGroup[] }>(`/sac/theatres/${theatreId}/dooh`, b),
  proofOfPlay: () => http.get<C.ProofOfPlayRow[]>('/sac/proof-of-play'),
  invoices: () => http.get<C.InvoiceRow[]>('/invoices')
};

/** The category master is readable by every portal (brand requests and catalogues need it). */
export const catalogApi = {
  categories: () => http.get<CategoryNode[]>('/categories')
};

const itemPath = (brandId: string, productId?: string, variantId?: string) =>
  `/admin/brands/${brandId}` + (productId ? `/products/${productId}` : '') + (variantId ? `/variants/${variantId}` : '');

export const adminApi = {
  categoryMaster: () => http.get<C.CategoryMaster>('/admin/categories'),
  addCategory: (b: C.CategoryInput) => http.post<C.CategoryMaster>('/admin/categories', b),
  renameCategory: (id: string, name: string) => http.put<C.CategoryMaster>(`/admin/categories/${id}`, { name }),
  moveCategory: (id: string, dir: 'up' | 'down') => http.post<C.CategoryMaster>(`/admin/categories/${id}/move`, { dir }),
  deleteCategory: (id: string) => http.del<C.CategoryMaster>(`/admin/categories/${id}`),
  brands: (query: C.BrandsQuery = {}) =>
    http.get<C.BrandsPage>('/admin/brands' + q(Object.fromEntries(Object.entries(query).map(([k, v]) => [k, v === undefined ? undefined : String(v)])))),
  brand: (id: string) => http.get<C.AdminBrandRow>(itemPath(id)),
  updateBrand: (id: string, b: C.BrandInput) => http.put<C.AdminBrandRow>(itemPath(id), b),
  addProduct: (brandId: string, b: C.BrandItemInput) => http.post<C.AdminBrandRow>(`${itemPath(brandId)}/products`, b),
  updateProduct: (brandId: string, productId: string, b: C.BrandItemInput) => http.put<C.AdminBrandRow>(itemPath(brandId, productId), b),
  deleteProduct: (brandId: string, productId: string) => http.del<C.AdminBrandRow>(itemPath(brandId, productId)),
  addVariant: (brandId: string, productId: string, b: C.BrandItemInput) => http.post<C.AdminBrandRow>(`${itemPath(brandId, productId)}/variants`, b),
  updateVariant: (brandId: string, productId: string, variantId: string, b: C.BrandItemInput) => http.put<C.AdminBrandRow>(itemPath(brandId, productId, variantId), b),
  deleteVariant: (brandId: string, productId: string, variantId: string) => http.del<C.AdminBrandRow>(itemPath(brandId, productId, variantId)),
  overview: () => http.get<C.PlatformOverview>('/admin/overview'),
  exhibitors: () => http.get<C.ExhibitorRow[]>('/admin/exhibitors'),
  createExhibitor: (b: C.ExhibitorInput) => http.post<Exhibitor>('/admin/exhibitors', b),
  sacs: (query: C.SacsQuery = {}) =>
    http.get<C.SacsPage>('/admin/sacs' + q(Object.fromEntries(Object.entries(query).map(([k, v]) => [k, v === undefined ? undefined : String(v)])))),
  /** Every SAC (for pickers, overview and filters); the list screen pages instead. */
  allSacs: async () => {
    const rows: C.SacRow[] = [];
    for (let page = 1; ; page++) {
      const p = await http.get<C.SacsPage>(`/admin/sacs?pageSize=1000&page=${page}`);
      rows.push(...p.rows);
      if (p.rows.length === 0 || rows.length >= p.total) return rows;
    }
  },
  createSac: (b: C.SacInput) => http.post<C.SacRow>('/admin/sacs', b),
  /** One call per section; each returns the refreshed row. */
  updateSacDetails: (id: string, b: C.SacDetailsInput) => http.put<C.SacRow>(`/admin/sacs/${id}/details`, b),
  updateSacSetup: (id: string, b: C.SacSetupInput) => http.put<C.SacRow>(`/admin/sacs/${id}/setup`, b),
  updateSacContacts: (id: string, b: C.SacContactsInput) => http.put<C.SacRow>(`/admin/sacs/${id}/contacts`, b),
  updateSacBilling: (id: string, b: C.SacBillingInput) => http.put<C.SacRow>(`/admin/sacs/${id}/billing`, b),
  updateSacCollections: (id: string, b: C.SacCollectionsInput) => http.put<C.SacRow>(`/admin/sacs/${id}/collections`, b),
  setSacStatus: (id: string, b: C.SacStatusInput) => http.put<C.SacRow>(`/admin/sacs/${id}/status`, b),
  sacActiveScreens: (id: string) => http.get<C.SacActiveScreens>(`/admin/sacs/${id}/active-screens`),
  addGateway: (id: string, b: C.GatewayInput) => http.post<C.SacRow>(`/admin/sacs/${id}/gateways`, b),
  updateGateway: (id: string, gatewayId: string, b: C.GatewayInput) => http.put<C.SacRow>(`/admin/sacs/${id}/gateways/${gatewayId}`, b),
  setDefaultGateway: (id: string, gatewayId: string) => http.post<C.SacRow>(`/admin/sacs/${id}/gateways/${gatewayId}/default`),
  setGatewayEnabled: (id: string, gatewayId: string, enabled: boolean) => http.post<C.SacRow>(`/admin/sacs/${id}/gateways/${gatewayId}/enabled`, { enabled }),
  deleteGateway: (id: string, gatewayId: string) => http.del<C.SacRow>(`/admin/sacs/${id}/gateways/${gatewayId}`),
  sacTheatres: (id: string, query: C.SacTheatresQuery) =>
    http.get<C.SacTheatresPage>(`/admin/sacs/${id}/theatres` + q(Object.fromEntries(Object.entries(query).map(([k, v]) => [k, v === undefined ? undefined : String(v)])))),
  syncSac: (id: string) => http.post<C.SacSyncResult>(`/admin/sacs/${id}/sync`),
  users: () => http.get<User[]>('/admin/users'),
  theatres: () => http.get<C.TheatreRow[]>('/admin/theatres'),
  devices: () => http.get<C.DeviceRow[]>('/admin/devices'),
  ingestion: () => http.get<C.IngestionRow[]>('/admin/ingestion'),
  advertisers: () => http.get<(C.AdvertiserRow & { sacName: string })[]>('/admin/advertisers'),
  campaigns: () => http.get<(C.CampaignRow & { sacName: string })[]>('/admin/campaigns'),
  audit: (filter?: { entity?: string }) => http.get<AuditEvent[]>('/admin/audit' + q(filter ?? {})),
  impersonate: (userId: string, reason: string) => http.post<{ userId: string; impersonatorId: string; portal: 'advertiser' | 'sac' }>('/admin/impersonate', { userId, reason })
};
