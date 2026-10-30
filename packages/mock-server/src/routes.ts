import {
  applyPlacementAction, assertSubmittable, can, checkoutChecklist, decide, deviceHealth, ingestionFor, quotePlacement,
  resolveReach, rollupStatus, statusOnApproval, submissionPath, summarizeDelivery, summarizeTargetGroup, validateDoohGroup,
  visibleTheatres, withGst, CampaignRuleError, TransitionError, placementActions, sacInventory, exhibitorsOf,
  BILLING_CURRENCIES, BILLING_FREQUENCIES, BILLING_METHODS, CONTACT_ROLES, DEFAULT_SUPPORT_EMAIL, LOGO_MAX_BYTES, addGateway, checkoutGateway, cleanContacts,
  cleanTaxIds, contactError, defaultBranding, defaultGateway, emptyContacts, gatewayError, isEmail, isHexColour, monthKey, primaryColourError, normaliseSacHost, removeGateway,
  sacSubdomain, sacUrlError, screenHistoryGrid, setDefaultGateway, stampGatewayDates, taxIdsError,
  brandCategoryIds, brandMatchesCategory, dedupe, deleteBlock, nodeNameError, normaliseName, pathLabel, pathLabels, reorderedSiblings, subtreeIds, unknownIds, usageCounts,
  type Brand, type Campaign, type CategoryNode, type Company, type Permission, type Placement, type User
} from '@slate/domain';
import type {
  AdminBrandRow, BrandInput, BrandItemInput, BrandsPage, BrandView, CategoryInput, CategoryMaster, AdvertiserRow, AdvertiserTermsInput, BillingOverview, BrandRow, CampaignDetail, CampaignInput, CampaignRow, CheckoutInput,
  Dashboard, DecisionInput, DeliveryBreakdown, DemoAccount, DeviceRow, DoohConfigInput, ExhibitorInput, ExhibitorRow,
  GatewayInput, IngestionRow, PublicSac, SacActiveScreens, SacBillingInput, SacCollectionsInput, SacContactsInput, SacDetailsInput, SacSetupInput, SacStatusInput, SacSortKey, SacsPage, SessionSac, InvoiceRow, KycDecisionInput, MediaInput, PlacementInput, PlacementQuoteResponse, PlacementRow,
  PlatformOverview, ProofOfPlayRow, ReachPreview, SacInput, SacRow, SacSyncResult, SacTheatreRow, SacTheatresPage, Session, TargetGroupInput, TargetGroupWithReach, TheatreRow, UserInput
} from '@slate/api/contracts';
import { forbidden, HttpError, invalid, notFound, Router, type Req } from './http';
import { createSeed, today, type Db } from './seed';

export function buildRoutes(state: { db: Db }, reset: () => void) {
  const r = new Router();
  const db = () => state.db;
  const id = (prefix: string) => `${prefix}-${++db().seq}`;
  const now = () => new Date().toISOString();

  // ---------- session ----------
  function session(req: Req): { user: User; impersonator: User | null } {
    const uid = req.headers['x-slate-user'];
    const user = db().users.find(u => u.id === uid);
    if (!user) throw new HttpError(401, 'Not signed in.');
    const impId = req.headers['x-slate-impersonator'];
    const impersonator = impId ? db().users.find(u => u.id === impId && u.portal === 'admin') ?? null : null;
    // An inactive SAC loses access for its own users and for every advertiser it sells to.
    const sacId = user.portal === 'sac' ? user.orgId : user.portal === 'advertiser' ? db().companies.find(c => c.id === user.orgId)?.sacId : null;
    if (sacId && db().sacs.find(s => s.id === sacId)?.status === 'inactive') {
      throw forbidden('This account is inactive. Contact Qube support.');
    }
    return { user, impersonator };
  }
  function need(req: Req, portal: User['portal'], permission?: Permission) {
    const s = session(req);
    if (s.user.portal !== portal) throw forbidden(`This needs a ${portal} account.`);
    if (permission && !can(s.user.role, permission)) throw forbidden();
    return s;
  }
  const companyOf = (req: Req, permission?: Permission) => {
    const s = need(req, 'advertiser', permission);
    const company = db().companies.find(c => c.id === s.user.orgId)!;
    return { ...s, company, sac: db().sacs.find(x => x.id === company.sacId)! };
  };
  const sacOf = (req: Req, permission?: Permission) => {
    const s = need(req, 'sac', permission);
    return { ...s, sac: db().sacs.find(x => x.id === s.user.orgId)! };
  };
  function audit(s: { user: User; impersonator: User | null }, action: string, entity: string, entityId: string, detail: string) {
    db().audit.unshift({
      id: id('AU'), at: now(), actorId: s.user.id, actorName: s.user.name, portal: s.user.portal,
      action, entity, entityId, detail, impersonatedBy: s.impersonator?.name ?? null
    });
  }
  /** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30 and free text). */
  const isIsoDate = (v: unknown): v is string =>
    typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z')) &&
    new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
  const byKey = <T,>(items: T[], key: (t: T) => string) => {
    const m = new Map<string, T[]>();
    for (const it of items) { const k = key(it); const arr = m.get(k); if (arr) arr.push(it); else m.set(k, [it]); }
    return m;
  };
  const find = <T extends { id: string }>(list: T[], key: string, what: string) => {
    const x = list.find(i => i.id === key);
    if (!x) throw notFound(`${what} not found.`);
    return x;
  };

  // ---------- derived rows ----------
  const theatresFor = (company: Company) => visibleTheatres(company, db().theatres, db().doohGroups);
  /** DOOH groups mapped to the advertiser's SAC, in theatres it may book. */
  const doohFor = (company: Company) => {
    const ids = new Set(theatresFor(company).map(t => t.id));
    return db().doohGroups.filter(g => g.sacId === company.sacId && ids.has(g.theatreId));
  };
  const reachOf = (company: Company, tgId: string) => {
    const tg = find(db().targetGroups, tgId, 'Target group');
    return resolveReach(tg, theatresFor(company), doohFor(company));
  };
  const deliveryOf = (pred: (d: Db['delivery'][number]) => boolean) => summarizeDelivery(db().delivery.filter(pred));
  const placementRow = (p: Placement): PlacementRow => {
    const media = db().media.find(m => m.id === p.mediaId);
    return {
      ...p, mediaName: media?.name ?? '—', mediaDuration: media?.durationSecs ?? 0,
      targetGroupName: db().targetGroups.find(t => t.id === p.targetGroupId)?.name ?? '—',
      delivered: deliveryOf(d => d.placementId === p.id),
      actions: placementActions(p, today())
    };
  };
  const campaignRow = (c: Campaign): CampaignRow => {
    const pls = db().placements.filter(p => p.campaignId === c.id);
    return {
      ...c,
      brandName: db().brands.find(b => b.id === c.brandId)?.name ?? '—',
      companyName: db().companies.find(x => x.id === c.companyId)?.name ?? '—',
      placementCount: pls.length,
      screens: pls.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.screens, 0),
      bookedValue: pls.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.cost, 0),
      delivered: deliveryOf(d => d.campaignId === c.id)
    };
  };
  const outstanding = (companyId: string) =>
    db().campaigns
      .filter(c => c.companyId === companyId && c.billingType === 'contracted' && ['pending_approval', 'scheduled', 'active', 'paused'].includes(c.status))
      .reduce((s, c) => s + withGst(db().placements.filter(p => p.campaignId === c.id && p.status !== 'cancelled').reduce((a, p) => a + p.cost, 0)).total, 0);
  const campaignDetail = (c: Campaign): CampaignDetail => {
    const company = db().companies.find(x => x.id === c.companyId)!;
    const pls = db().placements.filter(p => p.campaignId === c.id);
    let path: CampaignDetail['path'];
    try { path = submissionPath(company); } catch { path = 'locked'; }
    return {
      ...campaignRow(c),
      placements: pls.map(placementRow),
      checklist: checkoutChecklist({ campaign: c, media: db().media, placements: pls, company, outstanding: outstanding(company.id) })
        .concat(pls.length ? [{ key: 'fit' as const, label: 'Placements fit the flight, channels and attachments', done: misfits(c.id, c).length === 0 }] : []),
      path
    };
  };
  const ownCampaign = (req: Req, permission?: Permission) => {
    const s = companyOf(req, permission);
    const c = find(db().campaigns, req.params.id!, 'Campaign');
    if (c.companyId !== s.company.id) throw notFound('Campaign not found.');
    return { ...s, c };
  };
  const syncCampaign = (c: Campaign) => {
    c.status = rollupStatus(c.status, db().placements.filter(p => p.campaignId === c.id));
  };
  const tgRow = (company: Company, tg: Db['targetGroups'][number]): TargetGroupWithReach => {
    const reach = resolveReach(tg, theatresFor(company), doohFor(company));
    return {
      ...tg, summary: summarizeTargetGroup(tg),
      reach: { units: reach.units, theatres: reach.theatres.length, cities: reach.cities },
      usedBy: db().campaigns.filter(c => c.targetGroupIds.includes(tg.id)).length
    };
  };

  // ================= session =================
  r.get('/api/demo-accounts', (): DemoAccount[] => db().users.filter(u => u.status === 'active').map(user => ({
    user,
    orgName: user.portal === 'admin' ? 'Qube Cinema' : user.portal === 'sac'
      ? db().sacs.find(s => s.id === user.orgId)!.name : db().companies.find(c => c.id === user.orgId)!.name
  })));
  /** Public: resolves a SAC's sign-up link / branding. */
  r.get('/api/sacs/:subdomain', (req): PublicSac => {
    const sub = req.params.subdomain!.toLowerCase();
    const sac = db().sacs.find(x => sacSubdomain(x.url) === sub && x.status === 'active');
    if (!sac) throw notFound('Unknown sales house.');
    return { name: sac.name, legalName: sac.legalName, subdomain: sub, supportEmail: sac.supportEmail, branding: sac.branding };
  });
  const sessionSac = (sac: Db['sacs'][number]): SessionSac => {
    const g = checkoutGateway(sac.gateways) ?? defaultGateway(sac.gateways);
    return {
      id: sac.id, name: sac.name, legalName: sac.legalName, url: sac.url, supportEmail: sac.supportEmail, branding: sac.branding,
      gateway: g ? { provider: g.provider, mode: g.mode, enabled: g.enabled } : null
    };
  };
  r.get('/api/session', (req): Session => {
    const s = session(req);
    if (s.user.portal === 'advertiser') {
      const company = db().companies.find(c => c.id === s.user.orgId)!;
      return { ...s, org: { kind: 'company', company, sac: sessionSac(db().sacs.find(x => x.id === company.sacId)!) } };
    }
    if (s.user.portal === 'sac') return { ...s, org: { kind: 'sac', sac: sessionSac(db().sacs.find(x => x.id === s.user.orgId)!) } };
    return { ...s, org: { kind: 'qube' } };
  });
  r.post('/api/_reset', () => { reset(); return { ok: true }; });

  // ================= advertiser: company, KYC, users =================
  r.get('/api/company', req => companyOf(req).company);
  r.put('/api/company', (req: Req<Partial<Pick<Company, 'name' | 'gstin' | 'pan' | 'address' | 'contacts'>>>) => {
    const s = companyOf(req, 'company.edit');
    const c = s.company;
    const { name, address, contacts, gstin, pan } = req.body;
    if (gstin !== undefined && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) throw invalid('Enter a valid 15-character GSTIN.');
    if (pan !== undefined && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) throw invalid('Enter a valid 10-character PAN.');
    if (name !== undefined && !name.trim()) throw invalid('Registered name is required.');
    const regChanged = (gstin !== undefined && gstin !== c.gstin) || (pan !== undefined && pan !== c.pan);
    Object.assign(c, Object.fromEntries(Object.entries({ name, address, contacts, gstin, pan }).filter(([, v]) => v !== undefined)));
    if (regChanged && c.kycStatus === 'approved') {
      c.kycStatus = 'pending'; c.kycSubmittedAt = now(); c.kycReviewedAt = null;
      audit(s, 'kyc.resubmit', 'company', c.id, 'GST/PAN changed — KYC re-submitted for review');
    } else audit(s, 'company.update', 'company', c.id, 'Updated company details');
    return c;
  });
  r.post('/api/company/kyc-docs', (req: Req<{ kind: Company['kycDocs'][number]['kind']; fileName: string }>) => {
    const s = companyOf(req, 'company.edit');
    const doc = s.company.kycDocs.find(d => d.kind === req.body.kind);
    if (!doc) throw invalid('Unknown document type.');
    Object.assign(doc, { fileName: req.body.fileName, uploadedAt: now(), status: 'uploaded', note: undefined });
    return s.company;
  });
  r.post('/api/company/submit-kyc', req => {
    const s = companyOf(req, 'company.edit');
    if (s.company.kycDocs.some(d => d.status === 'missing')) throw invalid('Upload every KYC document before submitting.');
    if (s.company.kycStatus === 'approved') throw invalid('KYC is already approved.');
    Object.assign(s.company, { kycStatus: 'pending', kycSubmittedAt: now(), kycNote: null });
    audit(s, 'kyc.submit', 'company', s.company.id, 'Submitted KYC for review');
    return s.company;
  });
  /** Self sign-up: creates the company record under a SAC plus its first admin user. */
  r.post('/api/signup', (req: Req<{ sacSubdomain: string; companyName: string; gstin: string; pan: string; address: string; name: string; email: string; phone: string }>) => {
    const b = req.body;
    const sac = db().sacs.find(x => sacSubdomain(x.url) === (b.sacSubdomain ?? '').toLowerCase() && x.status === 'active');
    if (!sac) throw invalid('This sign-up link is not valid. Ask your sales house for the correct link.');
    if (!b.companyName?.trim() || !b.name?.trim() || !b.email?.includes('@')) throw invalid('Company name, your name and a valid email are required.');
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(b.gstin ?? '')) throw invalid('Enter a valid 15-character GSTIN.');
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(b.pan ?? '')) throw invalid('Enter a valid 10-character PAN.');
    const company: Company = {
      id: id('CO'), sacId: sac.id, code: `ADV-${10000 + db().seq}`, name: b.companyName.trim(), gstin: b.gstin, pan: b.pan, address: b.address,
      kycStatus: 'draft', kycSubmittedAt: null, kycReviewedAt: null, kycNote: null, billingType: null, contract: null, inventoryAccess: { mode: 'full' },
      kycDocs: (['GST certificate', 'PAN card', 'Certificate of incorporation', 'Authorised signatory ID'] as const).map(kind => ({ kind, fileName: null, uploadedAt: null, status: 'missing' })),
      contacts: [{ id: id('CT'), role: 'Primary', name: b.name, email: b.email, phone: b.phone }], createdAt: now()
    };
    const user: User = { id: id('U'), name: b.name, email: b.email, phone: b.phone, portal: 'advertiser', orgId: company.id, role: 'admin', status: 'active', lastActiveAt: now() };
    db().companies.push(company);
    db().users.push(user);
    return { userId: user.id };
  });

  const PORTAL_ROLES: Record<User['portal'], User['role'][]> = {
    advertiser: ['admin', 'planner', 'viewer'], sac: ['sac_admin', 'ad_ops', 'finance', 'viewer'], admin: ['qube_admin', 'qube_support']
  };
  const ADMIN_ROLE: Record<User['portal'], User['role']> = { advertiser: 'admin', sac: 'sac_admin', admin: 'qube_admin' };
  const assertRole = (portal: User['portal'], role: User['role'] | undefined) => {
    if (role !== undefined && !PORTAL_ROLES[portal].includes(role)) throw invalid('That role does not exist in this portal.');
  };
  const isLastAdmin = (u: User) => u.role === ADMIN_ROLE[u.portal] && u.status === 'active' &&
    db().users.filter(x => x.orgId === u.orgId && x.portal === u.portal && x.role === u.role && x.status === 'active').length === 1;

  r.get('/api/users', req => {
    const s = session(req);
    return db().users.filter(u => u.portal === s.user.portal && u.orgId === s.user.orgId);
  });
  r.post('/api/users', (req: Req<UserInput>) => {
    const s = session(req);
    if (!can(s.user.role, 'users.manage') && s.user.role !== 'qube_admin') throw forbidden();
    if (!req.body.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email ?? '')) throw invalid('Name and a valid email are required.');
    if (db().users.some(u => u.email.toLowerCase() === req.body.email.toLowerCase())) throw invalid('A user with this email already exists.');
    if (!req.body.role) throw invalid('Choose a role for the new user.');
    assertRole(s.user.portal, req.body.role);
    const { name, email, phone, role } = req.body;
    const u: User = { id: id('U'), name, email, phone, role, portal: s.user.portal, orgId: s.user.orgId, status: 'invited', lastActiveAt: null };
    db().users.push(u);
    audit(s, 'user.invite', 'user', u.id, `Invited ${u.email} as ${u.role}`);
    return u;
  });
  r.put('/api/users/:id', (req: Req<Partial<UserInput & { status: User['status'] }>>) => {
    const s = session(req);
    if (!can(s.user.role, 'users.manage') && s.user.role !== 'qube_admin') throw forbidden();
    const u = find(db().users, req.params.id!, 'User');
    if (u.orgId !== s.user.orgId) throw notFound('User not found.');
    if (u.id === s.user.id && req.body.role && req.body.role !== u.role) throw invalid('You cannot change your own role.');
    assertRole(u.portal, req.body.role);
    // Email is the login identity: it can't be edited; invite the new address instead.
    if (req.body.email !== undefined && req.body.email !== u.email) throw invalid('Email can’t be changed. Invite the new address and remove this user.');
    const { name, phone, role, status } = req.body;
    if (status !== undefined && !['active', 'invited', 'disabled'].includes(status as string)) throw invalid('Status must be active, invited or disabled.');
    if (((role !== undefined && role !== u.role) || (status !== undefined && status !== 'active')) && isLastAdmin(u)) throw invalid('Keep at least one active admin.');
    Object.assign(u, Object.fromEntries(Object.entries({ name, phone, role, status }).filter(([, v]) => v !== undefined)));
    audit(s, 'user.update', 'user', u.id, `Updated ${u.email}`);
    return u;
  });
  r.delete('/api/users/:id', req => {
    const s = session(req);
    if (!can(s.user.role, 'users.manage') && s.user.role !== 'qube_admin') throw forbidden();
    const u = find(db().users, req.params.id!, 'User');
    if (u.orgId !== s.user.orgId) throw notFound('User not found.');
    if (u.id === s.user.id) throw invalid('You cannot remove yourself.');
    if (isLastAdmin(u)) throw invalid('Keep at least one active admin.');
    db().users = db().users.filter(x => x.id !== u.id);
    audit(s, 'user.remove', 'user', u.id, `Removed ${u.email}`);
  });

  // ================= advertiser: brands, inventory =================
  /** Brand with the union of its brand / product / variant category mappings resolved to readable paths. */
  const brandView = (b: Brand): BrandView => {
    const ids = brandCategoryIds(b).filter(c => pathLabel(db().categories, c));
    return { ...b, allCategoryIds: ids, categoryPaths: pathLabels(db().categories, ids) };
  };
  /** Category ids from a request: deduplicated, and every one must exist in the master. */
  const checkedCategoryIds = (raw: unknown, required: boolean): string[] => {
    const ids = dedupe(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
    if (required && !ids.length) throw invalid('Choose at least one category.');
    if (unknownIds(db().categories, ids).length) throw invalid('One of the chosen categories no longer exists.');
    return ids;
  };
  r.get('/api/categories', req => { session(req); return db().categories; });
  r.get('/api/brands', req => db().brands.filter(b => b.companyId === companyOf(req).company.id).map(brandView));
  r.post('/api/brands', (req: Req<{ name: string; categoryIds: string[] }>) => {
    const s = companyOf(req, 'company.edit');
    if (!req.body.name?.trim()) throw invalid('Brand name is required.');
    const categoryIds = checkedCategoryIds(req.body.categoryIds, true);
    const b: Brand = { id: id('BR'), companyId: s.company.id, name: req.body.name.trim(), categoryIds, products: [], status: 'pending', requestedAt: now(), reviewedAt: null, note: null };
    db().brands.push(b);
    audit(s, 'brand.request', 'brand', b.id, `Requested approval for ${b.name}`);
    return brandView(b);
  });
  r.get('/api/inventory/theatres', req => theatresFor(companyOf(req).company));
  r.get('/api/inventory/dooh-groups', req => doohFor(companyOf(req).company));

  // ================= advertiser: target groups =================
  r.get('/api/target-groups', req => {
    const { company } = companyOf(req);
    return db().targetGroups.filter(t => t.companyId === company.id).map(t => tgRow(company, t));
  });
  r.get('/api/target-groups/:id', req => {
    const { company } = companyOf(req);
    const tg = find(db().targetGroups, req.params.id!, 'Target group');
    if (tg.companyId !== company.id) throw notFound('Target group not found.');
    return tgRow(company, tg);
  });
  r.post('/api/target-groups/preview', (req: Req<TargetGroupInput>): ReachPreview => {
    const { company } = companyOf(req);
    const reach = resolveReach({ ...req.body, id: 'preview', companyId: company.id, createdAt: '', updatedAt: '' }, theatresFor(company), doohFor(company));
    return {
      units: reach.units, theatres: reach.theatres.length, cities: reach.cities,
      sample: reach.theatres.slice(0, 8).map(t => ({
        id: t.id, name: t.name, city: t.city,
        units: req.body.channel === 'cinema' ? reach.screens.filter(s => s.theatreId === t.id).length : reach.doohGroups.filter(g => g.theatreId === t.id).length
      }))
    };
  });
  r.post('/api/target-groups', (req: Req<TargetGroupInput>) => {
    const s = companyOf(req, 'targets.edit');
    if (!req.body.name?.trim()) throw invalid('Target group name is required.');
    const tg = { ...req.body, id: id('TG'), companyId: s.company.id, createdAt: now(), updatedAt: now() };
    db().targetGroups.push(tg);
    audit(s, 'target-group.create', 'target-group', tg.id, tg.name);
    return tgRow(s.company, tg);
  });
  r.put('/api/target-groups/:id', (req: Req<TargetGroupInput>) => {
    const s = companyOf(req, 'targets.edit');
    const tg = find(db().targetGroups, req.params.id!, 'Target group');
    if (tg.companyId !== s.company.id) throw notFound('Target group not found.');
    if (req.body.channel !== tg.channel && db().campaigns.some(c => c.targetGroupIds.includes(tg.id))) {
      throw invalid('This target group is used by campaigns, so its channel can’t change. Create a new group instead.');
    }
    Object.assign(tg, req.body, { updatedAt: now() });
    return tgRow(s.company, tg);
  });
  r.delete('/api/target-groups/:id', req => {
    const s = companyOf(req, 'targets.edit');
    const tg = find(db().targetGroups, req.params.id!, 'Target group');
    if (tg.companyId !== s.company.id) throw notFound('Target group not found.');
    if (db().placements.some(p => p.targetGroupId === tg.id)) throw invalid('This target group is used by placements and cannot be deleted.');
    db().targetGroups = db().targetGroups.filter(t => t.id !== tg.id);
  });

  // ================= advertiser: media =================
  r.get('/api/media', req => {
    const { company } = companyOf(req);
    return db().media.filter(m => m.companyId === company.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
  r.post('/api/media', (req: Req<MediaInput>) => {
    const s = companyOf(req, 'media.edit');
    const b = req.body;
    if (!b.name?.trim()) throw invalid('Media name is required.');
    if (!db().brands.some(x => x.id === b.brandId && x.companyId === s.company.id && x.status === 'approved')) throw invalid('Pick an approved brand.');
    if (b.fileType === 'CPL' && !b.censorCertificate) throw invalid('A censor certificate is required for CPLs.');
    if (b.fileType === 'CPL' && !b.attributes?.length) throw invalid('Pick the CPL’s projection, aspect and sound attributes.');
    if (b.fileType !== 'Image' && !(b.durationSecs > 0)) throw invalid('Duration is required.');
    if (b.fileType !== 'CPL' && !b.orientation) throw invalid('Orientation is required.');
    const m = { ...b, id: id('MD'), companyId: s.company.id, status: 'processing' as const, rejectionReason: null, createdAt: now(), createdBy: s.user.name };
    db().media.push(m);
    // Simulated ingest: ready a few seconds later.
    setTimeout(() => { const x = db().media.find(y => y.id === m.id); if (x?.status === 'processing') x.status = 'ready'; }, 8000);
    audit(s, 'media.create', 'media', m.id, m.name);
    return m;
  });
  r.delete('/api/media/:id', req => {
    const s = companyOf(req, 'media.edit');
    const m = find(db().media, req.params.id!, 'Media');
    if (m.companyId !== s.company.id) throw notFound('Media not found.');
    if (db().placements.some(p => p.mediaId === m.id)) throw invalid('This media is used by placements and cannot be deleted.');
    db().media = db().media.filter(x => x.id !== m.id);
  });

  // ================= advertiser: campaigns =================
  r.get('/api/dashboard', (req): Dashboard => {
    const { company } = companyOf(req);
    const mine = db().campaigns.filter(c => c.companyId === company.id);
    const live = mine.filter(c => c.status === 'active');
    const delivered = deliveryOf(d => mine.some(c => c.id === d.campaignId));
    return {
      activeCampaigns: live.length,
      scheduledCampaigns: mine.filter(c => c.status === 'scheduled').length,
      screensLive: db().placements.filter(p => p.status === 'active' && mine.some(c => c.id === p.campaignId)).reduce((s, p) => s + p.screens, 0),
      playsDelivered: delivered.played,
      deliveryRate: delivered.rate,
      spendToDate: db().invoices.filter(i => i.companyId === company.id && i.status !== 'refunded').reduce((s, i) => s + i.amount, 0),
      pendingApprovals: mine.filter(c => c.status === 'pending_approval').length,
      recent: mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(campaignRow)
    };
  });
  r.get('/api/campaigns', req => {
    const { company } = companyOf(req);
    return db().campaigns.filter(c => c.companyId === company.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(campaignRow);
  });
  r.get('/api/campaigns/:id', req => campaignDetail(ownCampaign(req).c));
  const validateCampaign = (b: CampaignInput, company: Company) => {
    if (!db().brands.some(x => x.id === b.brandId && x.companyId === company.id && x.status === 'approved')) throw invalid('Pick an approved brand.');
    if (!b.channels?.length) throw invalid('Pick at least one channel.');
    if (b.start && b.end && b.start > b.end) throw invalid('End date must be on or after the start date.');
    for (const tgId of b.targetGroupIds ?? []) {
      const tg = db().targetGroups.find(t => t.id === tgId && t.companyId === company.id);
      if (!tg) throw invalid('One of the target groups is not available.');
      if (!b.channels.includes(tg.channel)) throw invalid(`“${tg.name}” is a ${tg.channel === 'cinema' ? 'cinema' : 'DOOH'} target group; add that channel or remove it.`);
    }
    for (const mId of b.mediaIds ?? []) {
      const m = db().media.find(x => x.id === mId && x.companyId === company.id);
      if (!m) throw invalid('One of the media items is not available.');
      if (m.brandId !== b.brandId) throw invalid(`“${m.name}” belongs to a different brand.`);
      // CPL plays in cinemas; video and image play on DOOH displays.
      const usable = m.fileType === 'CPL' ? b.channels.includes('cinema') : b.channels.includes('dooh');
      if (!usable) throw invalid(`“${m.name}” (${m.fileType}) can't play on the selected channels.`);
    }
  };
  r.post('/api/campaigns', (req: Req<CampaignInput>) => {
    const s = companyOf(req, 'campaign.edit');
    validateCampaign(req.body, s.company);
    const n = ++db().seq;
    const c: Campaign = {
      ...req.body, id: `CMP-${n}`, code: `CMP-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`, companyId: s.company.id, sacId: s.company.sacId,
      status: 'draft', billingType: null, payment: null, review: null, createdAt: now(), createdBy: s.user.name, submittedAt: null
    };
    db().campaigns.push(c);
    audit(s, 'campaign.create', 'campaign', c.id, c.name);
    return campaignDetail(c);
  });
  /** Placements that no longer fit the campaign's flight, channels or attachments. */
  const misfits = (campaignId: string, c: Pick<Campaign, 'start' | 'end' | 'channels' | 'mediaIds' | 'targetGroupIds'>) =>
    db().placements.filter(p => p.campaignId === campaignId && (
      p.from < c.start || p.to > c.end || !c.channels.includes(p.position.channel) ||
      !c.mediaIds.includes(p.mediaId) || !c.targetGroupIds.includes(p.targetGroupId)));
  const assertPlacementsFit = (campaignId: string, c: Parameters<typeof misfits>[1]) => {
    const bad = misfits(campaignId, c);
    if (bad.length) throw invalid(`${bad.map(p => p.code).join(', ')} no longer fit${bad.length === 1 ? 's' : ''} the campaign's flight, channels, media or target groups. Remove or change ${bad.length === 1 ? 'it' : 'them'} first.`);
  };

  r.put('/api/campaigns/:id', (req: Req<CampaignInput>) => {
    const s = ownCampaign(req, 'campaign.edit');
    if (s.c.status !== 'draft') throw invalid('Only draft campaigns can be edited.');
    validateCampaign(req.body, s.company);
    // Misfit placements don't block saving (the user needs to reach the Placements step to fix them);
    // they show as an open checklist item and block submission.
    Object.assign(s.c, req.body);
    return campaignDetail(s.c);
  });
  r.delete('/api/campaigns/:id', req => {
    const s = ownCampaign(req, 'campaign.edit');
    if (s.c.status !== 'draft') throw invalid('Only draft campaigns can be deleted.');
    db().campaigns = db().campaigns.filter(c => c.id !== s.c.id);
    db().placements = db().placements.filter(p => p.campaignId !== s.c.id);
  });

  const quote = (company: Company, b: PlacementInput): PlacementQuoteResponse => {
    const reach = reachOf(company, b.targetGroupId);
    const q = quotePlacement({ screens: reach.units, from: b.from, to: b.to, position: b.position });
    return { units: reach.units, theatres: reach.theatres.length, ...q };
  };
  const validatePlacement = (c: Campaign, b: PlacementInput) => {
    if (!c.mediaIds.includes(b.mediaId)) throw invalid('Attach the media to the campaign first.');
    if (!c.targetGroupIds.includes(b.targetGroupId)) throw invalid('Attach the target group to the campaign first.');
    if (!b.from || !b.to || b.from > b.to) throw invalid('Placement dates are invalid.');
    if (b.from < c.start || b.to > c.end) throw invalid('Placement dates must fall inside the campaign flight.');
    const tg = find(db().targetGroups, b.targetGroupId, 'Target group');
    if (tg.channel !== b.position.channel) throw invalid(`This target group is for ${tg.channel === 'cinema' ? 'cinema screens' : 'DOOH displays'}.`);
    const m = find(db().media, b.mediaId, 'Media');
    if (b.position.channel === 'cinema' && m.fileType !== 'CPL') throw invalid('Cinema placements need CPL media.');
    if (b.position.channel === 'dooh' && m.fileType === 'CPL') throw invalid('DOOH placements need video or image media.');
  };
  r.post('/api/campaigns/:id/quote', (req: Req<PlacementInput>) => quote(ownCampaign(req).company, req.body));
  r.post('/api/campaigns/:id/placements', (req: Req<PlacementInput>) => {
    const s = ownCampaign(req, 'campaign.edit');
    if (s.c.status !== 'draft') throw invalid('Placements can only be added while the campaign is a draft.');
    validatePlacement(s.c, req.body);
    const q = quote(s.company, req.body);
    if (!q.units) throw invalid('This target group reaches no inventory you can book.');
    const n = ++db().seq;
    db().placements.push({ ...req.body, id: `PL-${n}`, code: `PL-${n}`, campaignId: s.c.id, status: 'draft', screens: q.units, plannedPlays: q.plays, cost: q.cost, createdAt: now() });
    return campaignDetail(s.c);
  });
  r.patch('/api/placements/:pid', (req: Req<{ action: 'pause' | 'resume' | 'cancel' | 'delete' }>) => {
    const s = companyOf(req, 'campaign.edit');
    const p = find(db().placements, req.params.pid!, 'Placement');
    const c = find(db().campaigns, p.campaignId, 'Campaign');
    if (c.companyId !== s.company.id) throw notFound('Placement not found.');
    try {
      const next = applyPlacementAction(p, req.body.action, today());
      if (next === null) db().placements = db().placements.filter(x => x.id !== p.id);
      else p.status = next;
    } catch (e) {
      if (e instanceof TransitionError) throw invalid(e.message);
      throw e;
    }
    syncCampaign(c);
    audit(s, `placement.${req.body.action}`, 'placement', p.id, `${p.code} in ${c.name}`);
    return campaignDetail(c);
  });

  const submit = (s: ReturnType<typeof ownCampaign>, path: 'pay' | 'submit', body?: CheckoutInput) => {
    const { c, company } = s;
    if (c.status !== 'draft') throw invalid('This campaign has already been submitted.');
    try {
      if (submissionPath(company) !== path) throw invalid(path === 'pay' ? 'Your account is billed against a contract — submit instead of paying.' : 'Card advertisers pay at checkout.');
      assertPlacementsFit(c.id, c);
      const pls = db().placements.filter(p => p.campaignId === c.id);
      assertSubmittable(checkoutChecklist({ campaign: c, media: db().media, placements: pls, company, outstanding: outstanding(company.id) }));
      const { gst, total } = withGst(pls.reduce((a, p) => a + p.cost, 0));
      if (path === 'pay') {
        c.payment = { method: body?.method ?? 'card', amount: total, gst, gatewayRef: `pay_${Math.random().toString(36).slice(2, 12)}`, paidAt: now(), refundedAt: null };
        const n = 310 + db().invoices.length + 1;
        db().invoices.push({ id: `INV-${n}`, number: `${sacSubdomain(s.sac.url).toUpperCase().slice(0, 4)}/INV/26-27/${n}`, sacId: c.sacId, companyId: company.id, campaignId: c.id, amount: total, gst, issuedAt: now(), status: 'paid' });
      }
      Object.assign(c, { status: 'pending_approval', billingType: company.billingType, submittedAt: now() });
      audit(s, path === 'pay' ? 'campaign.pay' : 'campaign.submit', 'campaign', c.id, `${c.name} · ${total.toLocaleString('en-IN')}`);
    } catch (e) {
      if (e instanceof CampaignRuleError) throw invalid(e.message);
      throw e;
    }
    return campaignDetail(c);
  };
  r.post('/api/campaigns/:id/checkout', (req: Req<CheckoutInput>) => {
    const s = ownCampaign(req, 'campaign.checkout');
    if (!checkoutGateway(s.sac.gateways)) throw invalid(`${s.sac.name} has not enabled online payments yet. Contact ${s.sac.supportEmail}.`);
    return submit(s, 'pay', req.body);
  });
  r.post('/api/campaigns/:id/submit', req => submit(ownCampaign(req, 'campaign.checkout'), 'submit'));
  r.get('/api/campaigns/:id/delivery', (req): DeliveryBreakdown => delivery(ownCampaign(req).c.id));
  function delivery(campaignId: string, placementId?: string): DeliveryBreakdown {
    const rows = db().delivery.filter(d => d.campaignId === campaignId && (!placementId || d.placementId === placementId));
    const byDay = new Map<string, { date: string; planned: number; played: number; failed: number }>();
    const byTheatre = new Map<string, DeliveryBreakdown['byTheatre'][number]>();
    for (const d of rows) {
      const day = byDay.get(d.date) ?? { date: d.date, planned: 0, played: 0, failed: 0 };
      day.planned += d.planned; day.played += d.played; day.failed += d.failed; byDay.set(d.date, day);
      const t = db().theatres.find(x => x.id === d.theatreId)!;
      const th = byTheatre.get(d.theatreId) ?? { theatreId: t.id, theatre: t.name, city: t.city, planned: 0, played: 0, failed: 0 };
      th.planned += d.planned; th.played += d.played; th.failed += d.failed; byTheatre.set(d.theatreId, th);
    }
    return { summary: summarizeDelivery(rows), byDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)), byTheatre: [...byTheatre.values()].sort((a, b) => b.planned - a.planned) };
  }
  r.get('/api/placements/:pid/delivery', req => {
    const s = companyOf(req);
    const p = find(db().placements, req.params.pid!, 'Placement');
    if (find(db().campaigns, p.campaignId, 'Campaign').companyId !== s.company.id) throw notFound('Placement not found.');
    return delivery(p.campaignId, p.id);
  });

  r.get('/api/billing', (req): BillingOverview => {
    const s = companyOf(req, 'billing.view');
    const gw = defaultGateway(s.sac.gateways);
    return {
      billingType: s.company.billingType, contract: s.company.contract, outstanding: outstanding(s.company.id),
      sac: { name: s.sac.name, legalName: s.sac.legalName, supportEmail: s.sac.supportEmail, taxIds: s.sac.collections.taxIds },
      gateway: s.company.billingType === 'card' && gw ? { provider: gw.provider, enabled: gw.enabled, mode: gw.mode } : null
    };
  });
  const invoiceRow = (i: Db['invoices'][number]): InvoiceRow => ({
    ...i, campaignName: db().campaigns.find(c => c.id === i.campaignId)?.name ?? '—', companyName: db().companies.find(c => c.id === i.companyId)?.name ?? '—'
  });
  r.get('/api/invoices', req => {
    const s = session(req);
    if (s.user.portal === 'advertiser' && !can(s.user.role, 'billing.view')) throw forbidden();
    if (s.user.portal === 'sac' && !['sac_admin', 'finance'].includes(s.user.role)) throw forbidden();
    const list = s.user.portal === 'advertiser' ? db().invoices.filter(i => i.companyId === s.user.orgId)
      : s.user.portal === 'sac' ? db().invoices.filter(i => i.sacId === s.user.orgId) : db().invoices;
    return list.map(invoiceRow).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  });

  // ================= SAC =================
  const sacCompanies = (sacId: string) => db().companies.filter(c => c.sacId === sacId);
  const advertiserRow = (c: Company): AdvertiserRow => {
    const camps = db().campaigns.filter(x => x.companyId === c.id);
    return {
      ...c, brands: db().brands.filter(b => b.companyId === c.id),
      activeCampaigns: camps.filter(x => x.status === 'active').length,
      bookedValue: camps.reduce((s, x) => s + campaignRow(x).bookedValue, 0),
      outstanding: outstanding(c.id)
    };
  };
  const ownAdvertiser = (req: Req, permission?: Permission) => {
    const s = sacOf(req, permission);
    const c = find(db().companies, req.params.id!, 'Advertiser');
    if (c.sacId !== s.sac.id) throw notFound('Advertiser not found.');
    return { ...s, c };
  };
  r.get('/api/sac/dashboard', req => {
    const { sac } = sacOf(req);
    const companies = sacCompanies(sac.id).map(c => c.id);
    const camps = db().campaigns.filter(c => companies.includes(c.companyId));
    const theatres = sacInventory(sac.id, db().theatres, db().doohGroups);
    return {
      activeCampaigns: camps.filter(c => c.status === 'active').length,
      pendingCampaigns: camps.filter(c => c.status === 'pending_approval').length,
      pendingKyc: sacCompanies(sac.id).filter(c => c.kycStatus === 'pending').length,
      pendingBrands: db().brands.filter(b => companies.includes(b.companyId) && b.status === 'pending').length,
      theatres: theatres.length,
      screens: theatres.reduce((s, t) => s + t.screens.length, 0),
      bookedValue: camps.filter(c => !['draft', 'rejected', 'cancelled'].includes(c.status)).reduce((s, c) => s + campaignRow(c).bookedValue, 0),
      delivery: deliveryOf(d => camps.some(c => c.id === d.campaignId)),
      recent: camps.filter(c => c.status !== 'draft').sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')).slice(0, 6).map(campaignRow)
    };
  });
  r.get('/api/sac/advertisers', req => sacCompanies(sacOf(req).sac.id).map(advertiserRow));
  r.get('/api/sac/advertisers/:id', req => advertiserRow(ownAdvertiser(req).c));
  r.post('/api/sac/advertisers/:id/kyc-decision', (req: Req<KycDecisionInput>) => {
    const s = ownAdvertiser(req, 'approvals.decide');
    const b = req.body;
    if (s.c.kycStatus !== 'pending') throw invalid('Only advertisers pending review can be decided.');
    if (b.decision === 'approve') {
      if (!b.billingType) throw invalid('Choose Card / Prepaid or Contracted before approving.');
      if (b.billingType === 'contracted') {
        const k = b.contract;
        if (!k?.ref?.trim() || !(k.creditLimit > 0)) throw invalid('Contracted advertisers need a contract reference and credit limit.');
        if (!Number.isInteger(k.paymentTermsDays) || k.paymentTermsDays < 0 || k.paymentTermsDays > 180) throw invalid('Payment terms must be 0–180 days.');
        if (!isIsoDate(k.validUntil)) throw invalid('Contract end date must be a valid date (YYYY-MM-DD).');
        if (k.validUntil < today()) throw invalid('Contract end date must be today or later.');
      }
      Object.assign(s.c, { kycStatus: 'approved', billingType: b.billingType, contract: b.billingType === 'contracted' ? b.contract : null, kycReviewedAt: now(), kycNote: b.note });
      s.c.kycDocs.forEach(d => { if (d.status === 'uploaded') d.status = 'verified'; });
    } else {
      if (!b.note?.trim()) throw invalid('Give the advertiser a reason for rejecting.');
      Object.assign(s.c, { kycStatus: 'rejected', kycReviewedAt: now(), kycNote: b.note });
    }
    audit(s, `kyc.${b.decision}`, 'company', s.c.id, b.decision === 'approve' ? `Approved · ${b.billingType === 'card' ? 'Card / Prepaid' : 'Contracted'}` : `Rejected: ${b.note}`);
    return advertiserRow(s.c);
  });
  r.put('/api/sac/advertisers/:id/terms', (req: Req<AdvertiserTermsInput>) => {
    const s = ownAdvertiser(req, 'billing.classify');
    if (s.c.kycStatus !== 'approved') throw invalid('Approve KYC before setting commercial terms.');
    if (req.body.billingType === 'contracted' && !req.body.contract) throw invalid('Contracted advertisers need a contract.');
    Object.assign(s.c, { billingType: req.body.billingType, contract: req.body.billingType === 'contracted' ? req.body.contract : null, inventoryAccess: req.body.inventoryAccess });
    audit(s, 'advertiser.terms', 'company', s.c.id, `Billing ${req.body.billingType} · access ${req.body.inventoryAccess.mode}`);
    return advertiserRow(s.c);
  });
  r.get('/api/sac/brands', (req): BrandRow[] => {
    const ids = sacCompanies(sacOf(req).sac.id).map(c => c.id);
    return db().brands.filter(b => ids.includes(b.companyId)).map(b => ({ ...brandView(b), companyName: db().companies.find(c => c.id === b.companyId)!.name }));
  });
  r.post('/api/sac/brands/:id/decision', (req: Req<{ decision: 'approve' | 'reject'; note: string | null }>) => {
    const s = sacOf(req, 'approvals.decide');
    const b = find(db().brands, req.params.id!, 'Brand');
    if (find(db().companies, b.companyId, 'Advertiser').sacId !== s.sac.id) throw notFound('Brand not found.');
    if (b.status !== 'pending') throw invalid('This brand has already been decided.');
    if (req.body.decision === 'reject' && !req.body.note?.trim()) throw invalid('Give a reason for rejecting.');
    Object.assign(b, { status: req.body.decision === 'approve' ? 'approved' : 'rejected', reviewedAt: now(), note: req.body.note });
    audit(s, `brand.${req.body.decision}`, 'brand', b.id, b.name);
    return b;
  });
  r.get('/api/sac/campaigns', req => {
    const ids = sacCompanies(sacOf(req).sac.id).map(c => c.id);
    return db().campaigns.filter(c => ids.includes(c.companyId) && c.status !== 'draft').sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')).map(campaignRow);
  });
  r.get('/api/sac/campaigns/:id', req => {
    const s = sacOf(req);
    const c = find(db().campaigns, req.params.id!, 'Campaign');
    if (c.sacId !== s.sac.id || c.status === 'draft') throw notFound('Campaign not found.');
    return campaignDetail(c);
  });
  r.post('/api/sac/campaigns/:id/decision', (req: Req<DecisionInput>) => {
    const s = sacOf(req, 'approvals.decide');
    const c = find(db().campaigns, req.params.id!, 'Campaign');
    if (c.sacId !== s.sac.id) throw notFound('Campaign not found.');
    if (req.body.decision === 'reject' && !req.body.note?.trim()) throw invalid('Give the advertiser a reason for rejecting.');
    try {
      const out = decide(c, req.body.decision);
      c.status = out.status;
      c.review = { by: s.user.name, at: now(), note: req.body.note };
      const pls = db().placements.filter(p => p.campaignId === c.id);
      if (req.body.decision === 'approve') {
        pls.forEach(p => { p.status = statusOnApproval(p, today()); });
        syncCampaign(c);
      } else pls.forEach(p => { p.status = 'cancelled'; });
      if (out.refund && c.payment) {
        c.payment.refundedAt = now();
        db().invoices.filter(i => i.campaignId === c.id).forEach(i => { i.status = 'refunded'; });
      }
      audit(s, `campaign.${req.body.decision}`, 'campaign', c.id, c.name + (out.refund ? ' · payment refunded' : ''));
    } catch (e) {
      if (e instanceof CampaignRuleError) throw invalid(e.message);
      throw e;
    }
    return campaignDetail(c);
  });
  r.get('/api/sac/theatres', (req): TheatreRow[] => {
    const { sac } = sacOf(req);
    const mine = db().doohGroups.filter(g => g.sacId === sac.id);
    return sacInventory(sac.id, db().theatres, mine).map(t => {
      const groups = mine.filter(g => g.theatreId === t.id);
      return { ...t, exhibitorName: db().exhibitors.find(e => e.id === t.exhibitorId)!.name, doohGroups: groups, doohStatus: groups.length ? 'Configured' : 'Pending' };
    });
  });
  r.put('/api/sac/theatres/:id/dooh', (req: Req<DoohConfigInput>) => {
    const s = sacOf(req, 'inventory.edit');
    const t = find(db().theatres, req.params.id!, 'Theatre');
    if (!t.screens.some(x => x.sacId === s.sac.id) && !db().doohGroups.some(g => g.theatreId === t.id && g.sacId === s.sac.id)) throw notFound('Theatre not found.');
    // New groups arrive without ids; give each a temporary one so the uniqueness check compares them too.
    const keyed = req.body.groups.map((g, i) => ({ ...g, id: g.id || `new-${i}` }));
    const errors = keyed.flatMap(g => validateDoohGroup(g, keyed).map(e => `${g.name || 'Unnamed group'}: ${e}`));
    if (errors.length) throw invalid(errors.join(' '));
    t.hours = req.body.hours;
    t.updatedAt = now();
    t.updatedBy = s.user.name;
    // Only this SAC's groups are replaced; another SAC's displays in the same theatre are untouched.
    db().doohGroups = db().doohGroups.filter(g => !(g.theatreId === t.id && g.sacId === s.sac.id))
      .concat(req.body.groups.map(g => ({ ...g, id: g.id || id('DG'), theatreId: t.id, sacId: s.sac.id })));
    // DOOH groups are part of the mapping the SAC's exhibitor list is derived from.
    s.sac.exhibitorIds = exhibitorsOf(s.sac.id, db().theatres, db().doohGroups);
    audit(s, 'dooh.configure', 'theatre', t.id, `${req.body.groups.length} display groups`);
    // Return only this SAC's screens and groups, as /api/sac/theatres does, so split theatres stay isolated.
    return { ...t, screens: t.screens.filter(x => x.sacId === s.sac.id), doohGroups: db().doohGroups.filter(g => g.theatreId === t.id && g.sacId === s.sac.id) };
  });
  r.get('/api/sac/proof-of-play', (req): ProofOfPlayRow[] => {
    const { sac } = sacOf(req);
    const rows = new Map<string, ProofOfPlayRow>();
    for (const d of db().delivery) {
      const c = db().campaigns.find(x => x.id === d.campaignId)!;
      if (c.sacId !== sac.id) continue;
      const key = d.placementId + d.theatreId;
      const t = db().theatres.find(x => x.id === d.theatreId)!;
      const row = rows.get(key) ?? {
        campaignId: c.id, campaignName: c.name, companyName: db().companies.find(x => x.id === c.companyId)!.name,
        placementId: d.placementId, placementCode: db().placements.find(p => p.id === d.placementId)?.code ?? d.placementId,
        theatreId: t.id, theatre: t.name, city: t.city, planned: 0, played: 0, failed: 0
      };
      row.planned += d.planned; row.played += d.played; row.failed += d.failed;
      rows.set(key, row);
    }
    return [...rows.values()];
  });

  // ================= admin =================
  const adminOf = (req: Req, permission?: Permission) => need(req, 'admin', permission);
  /**
   * Per SAC: theatres (cinema or DOOH mapped) and cinema screens, all statuses, for list counts, plus the active
   * theatres with a device online now. One pass over theatres, DOOH groups and devices, with maps instead of nested scans.
   */
  const mappedCounts = () => {
    const out = new Map<string, { theatres: Set<string>; screens: number; connected: Set<string> }>();
    const entry = (sacId: string) => {
      let m = out.get(sacId);
      if (!m) { m = { theatres: new Set<string>(), screens: 0, connected: new Set<string>() }; out.set(sacId, m); }
      return m;
    };
    const t0 = Date.now();
    const online = new Set<string>();
    for (const d of db().devices) if (deviceHealth(d, t0) === 'online') online.add(d.theatreId);
    const connectedNow = (t: { id: string; status: string }) => t.status === 'active' && online.has(t.id);
    const theatreById = new Map(db().theatres.map(t => [t.id, t]));
    for (const t of db().theatres) for (const sc of t.screens) {
      if (!sc.sacId) continue;
      const m = entry(sc.sacId);
      m.theatres.add(t.id); m.screens += 1;
      if (connectedNow(t)) m.connected.add(t.id);
    }
    // A theatre where the SAC only has DOOH still counts as one of its theatres (screens stay cinema-only).
    for (const g of db().doohGroups) if (g.sacId) {
      const m = entry(g.sacId);
      m.theatres.add(g.theatreId);
      const t = theatreById.get(g.theatreId);
      if (t && connectedNow(t)) m.connected.add(t.id);
    }
    return out;
  };
  const sacRow = (s: Db['sacs'][number], counts = mappedCounts()): SacRow => ({
    ...s, exhibitorNames: s.exhibitorIds.map(e => db().exhibitors.find(x => x.id === e)?.name ?? e),
    theatres: counts.get(s.id)?.theatres.size ?? 0, screens: counts.get(s.id)?.screens ?? 0, connectedTheatres: counts.get(s.id)?.connected.size ?? 0,
    advertisers: sacCompanies(s.id).length, users: db().users.filter(u => u.orgId === s.id).length,
    bookedValue: db().campaigns.filter(c => c.sacId === s.id && !['draft', 'rejected', 'cancelled'].includes(c.status)).reduce((a, c) => a + campaignRow(c).bookedValue, 0)
  });
  r.get('/api/admin/overview', (req): PlatformOverview => {
    adminOf(req);
    const health = db().devices.map(d => deviceHealth(d, Date.now()));
    return {
      exhibitors: db().exhibitors.length, sacs: db().sacs.length, theatres: db().theatres.length,
      screens: db().theatres.reduce((s, t) => s + t.screens.length, 0), doohGroups: db().doohGroups.length,
      advertisers: db().companies.length, campaignsLive: db().campaigns.filter(c => c.status === 'active').length,
      bookedValue: db().campaigns.filter(c => !['draft', 'rejected', 'cancelled'].includes(c.status)).reduce((a, c) => a + campaignRow(c).bookedValue, 0),
      devicesOffline: health.filter(h => h === 'offline').length, devicesStale: health.filter(h => h === 'stale').length
    };
  });
  r.get('/api/admin/exhibitors', (req): ExhibitorRow[] => {
    adminOf(req);
    const exhibitorOf = new Map(db().theatres.map(t => [t.id, t.exhibitorId]));
    return db().exhibitors.map(e => {
      const ts = db().theatres.filter(t => t.exhibitorId === e.id);
      return {
        ...e, theatres: ts.length, screens: ts.reduce((s, t) => s + t.screens.length, 0),
        doohGroups: db().doohGroups.filter(g => exhibitorOf.get(g.theatreId) === e.id).length,
        sacs: db().sacs.filter(s => s.exhibitorIds.includes(e.id)).map(s => s.name)
      };
    });
  });
  r.post('/api/admin/exhibitors', (req: Req<ExhibitorInput>) => {
    const s = adminOf(req, 'tenants.manage');
    if (!req.body.name?.trim() || !req.body.code?.trim()) throw invalid('Name and code are required.');
    const e = { ...req.body, id: id('EX'), createdAt: now() };
    db().exhibitors.push(e);
    audit(s, 'exhibitor.create', 'exhibitor', e.id, e.name);
    return e;
  });
  const SAC_SORTS: Record<SacSortKey, true> = {
    name: true, theatres: true, screens: true, advertisers: true, users: true, connectedTheatres: true, status: true, createdAt: true, updatedAt: true, updatedBy: true
  };
  r.get('/api/admin/sacs', (req): SacsPage => {
    adminOf(req);
    const q = (req.query.get('q') ?? '').trim().toLowerCase();
    const location = (req.query.get('location') ?? '').trim().toLowerCase();
    const pageSize = Math.min(1000, Math.max(1, Number(req.query.get('pageSize')) || 100));
    const asked = req.query.get('sort') ?? '';
    const sort: SacSortKey = Object.hasOwn(SAC_SORTS, asked) ? asked as SacSortKey : 'name';
    const dir = req.query.get('dir') === 'desc' ? -1 : 1;
    const counts = mappedCounts();
    // Sort the whole result before paging, so a column sort orders every SAC, not just the current page.
    const matching = db().sacs
      .filter(x => (!q || x.name.toLowerCase().includes(q)) && (!location || `${x.location.city} ${x.location.country}`.toLowerCase().includes(location)))
      .map(x => sacRow(x, counts))
      .sort((a, b) => {
        const x = a[sort] ?? '', y = b[sort] ?? '';
        const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return (r || a.name.localeCompare(b.name)) * dir;
      });
    const page = Math.min(Math.max(1, Number(req.query.get('page')) || 1), Math.max(1, Math.ceil(matching.length / pageSize)));
    return { rows: matching.slice((page - 1) * pageSize, page * pageSize), total: matching.length, page, pageSize };
  });

  // ---------- category master ----------
  const master = (): CategoryMaster => ({ nodes: db().categories, usage: Object.fromEntries(usageCounts(db().categories, db().brands)) });
  const category = (key: string) => find(db().categories, key, 'Category');
  r.get('/api/admin/categories', req => { adminOf(req); return master(); });
  r.post('/api/admin/categories', (req: Req<CategoryInput>) => {
    const s = adminOf(req, 'catalog.manage');
    const parent = req.body.parentId ? category(req.body.parentId) : null;
    if (parent && parent.level >= 3) throw invalid('Categories go no deeper than SubCategory 2.');
    const err = nodeNameError(db().categories, parent?.id ?? null, req.body.name ?? '');
    if (err) throw invalid(err);
    const sibs = db().categories.filter(n => n.parentId === (parent?.id ?? null));
    const node: CategoryNode = {
      id: id('CAT'), parentId: parent?.id ?? null, level: ((parent?.level ?? 0) + 1) as CategoryNode['level'],
      name: normaliseName(req.body.name), order: Math.max(0, ...sibs.map(n => n.order)) + 1
    };
    db().categories.push(node);
    audit(s, 'category.create', 'category', node.id, pathLabel(db().categories, node.id));
    return master();
  });
  r.put('/api/admin/categories/:id', (req: Req<{ name: string }>) => {
    const s = adminOf(req, 'catalog.manage');
    const node = category(req.params.id!);
    const err = nodeNameError(db().categories, node.parentId, req.body.name ?? '', node.id);
    if (err) throw invalid(err);
    const before = pathLabel(db().categories, node.id);
    node.name = normaliseName(req.body.name);
    audit(s, 'category.rename', 'category', node.id, `${before} → ${node.name}`);
    return master();
  });
  r.post('/api/admin/categories/:id/move', (req: Req<{ dir: 'up' | 'down' }>) => {
    const s = adminOf(req, 'catalog.manage');
    const node = category(req.params.id!);
    if (req.body.dir !== 'up' && req.body.dir !== 'down') throw invalid('Move up or down.');
    const next = reorderedSiblings(db().categories, node.id, req.body.dir);
    if (!next) throw invalid(`Already ${req.body.dir === 'up' ? 'first' : 'last'}.`);
    for (const n of next) category(n.id).order = n.order;
    audit(s, 'category.reorder', 'category', node.id, `${pathLabel(db().categories, node.id)} moved ${req.body.dir}`);
    return master();
  });
  r.delete('/api/admin/categories/:id', req => {
    const s = adminOf(req, 'catalog.manage');
    const node = category(req.params.id!);
    const block = deleteBlock(db().categories, db().brands, node.id);
    if (block.blocked) throw invalid(block.message!);
    const label = pathLabel(db().categories, node.id);
    const gone = subtreeIds(db().categories, node.id);
    db().categories = db().categories.filter(n => !gone.has(n.id));
    audit(s, 'category.delete', 'category', node.id, gone.size > 1 ? `${label} (and ${gone.size - 1} below it)` : label);
    return master();
  });

  // ---------- brands, platform-wide ----------
  const adminBrandRow = (b: Brand): AdminBrandRow => {
    const company = db().companies.find(c => c.id === b.companyId)!;
    return { ...brandView(b), companyName: company.name, sacId: company.sacId, sacName: db().sacs.find(x => x.id === company.sacId)?.name ?? '—' };
  };
  const adminBrand = (key: string) => find(db().brands, key, 'Brand');
  r.get('/api/admin/brands', (req): BrandsPage => {
    adminOf(req);
    const q = (req.query.get('q') ?? '').trim().toLowerCase();
    const sacId = req.query.get('sacId') ?? '';
    const status = req.query.get('status') ?? '';
    const categoryId = req.query.get('categoryId') ?? '';
    const pageSize = Math.min(1000, Math.max(1, Number(req.query.get('pageSize')) || 100));
    const companies = new Map(db().companies.map(c => [c.id, c]));
    const matching = db().brands.filter(b => {
      const co = companies.get(b.companyId);
      if (sacId && co?.sacId !== sacId) return false;
      if (status && b.status !== status) return false;
      if (categoryId && !brandMatchesCategory(db().categories, b, categoryId)) return false;
      if (!q) return true;
      const hay = [b.name, co?.name ?? '', ...b.products.flatMap(p => [p.name, ...p.variants.map(v => v.name)]), ...pathLabels(db().categories, brandCategoryIds(b))];
      return hay.some(x => x.toLowerCase().includes(q));
    }).sort((a, b) => a.name.localeCompare(b.name));
    const page = Math.min(Math.max(1, Number(req.query.get('page')) || 1), Math.max(1, Math.ceil(matching.length / pageSize)));
    return { rows: matching.slice((page - 1) * pageSize, page * pageSize).map(adminBrandRow), total: matching.length, page, pageSize };
  });
  r.get('/api/admin/brands/:id', req => { adminOf(req); return adminBrandRow(adminBrand(req.params.id!)); });
  const itemName = (raw: unknown, what: string) => {
    const n = normaliseName(typeof raw === 'string' ? raw : '');
    if (!n) throw invalid(`${what} name is required.`);
    if (n.length > 80) throw invalid(`Keep the ${what.toLowerCase()} name under 80 characters.`);
    return n;
  };
  /** Names are unique among siblings (case-insensitive): products in a brand, variants in a product. */
  const uniqueAmong = (siblings: { id: string; name: string }[], name: string, selfId: string | null, what: string, where: string) => {
    if (siblings.some(x => x.id !== selfId && x.name.toLowerCase() === name.toLowerCase())) throw invalid(`${where} already has a ${what.toLowerCase()} called “${name}”.`);
  };
  const productOf = (b: Brand, key: string) => {
    const p = b.products.find(x => x.id === key);
    if (!p) throw notFound('Product not found.');
    return p;
  };
  r.put('/api/admin/brands/:id', (req: Req<BrandInput>) => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const name = itemName(req.body.name, 'Brand');
    b.categoryIds = checkedCategoryIds(req.body.categoryIds, false);
    audit(s, 'brand.update', 'brand', b.id, b.name === name ? name : `${b.name} → ${name}`);
    b.name = name;
    return adminBrandRow(b);
  });
  r.post('/api/admin/brands/:id/products', (req: Req<BrandItemInput>) => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const name = itemName(req.body.name, 'Product');
    uniqueAmong(b.products, name, null, 'Product', b.name);
    b.products.push({ id: id('PR'), name, categoryIds: checkedCategoryIds(req.body.categoryIds, false), variants: [] });
    audit(s, 'brand.product.add', 'brand', b.id, `${b.name} › ${name}`);
    return adminBrandRow(b);
  });
  r.put('/api/admin/brands/:id/products/:pid', (req: Req<BrandItemInput>) => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const p = productOf(b, req.params.pid!);
    const name = itemName(req.body.name, 'Product');
    uniqueAmong(b.products, name, p.id, 'Product', b.name);
    p.categoryIds = checkedCategoryIds(req.body.categoryIds, false);
    audit(s, 'brand.product.update', 'brand', b.id, `${b.name} › ${p.name === name ? name : `${p.name} → ${name}`}`);
    p.name = name;
    return adminBrandRow(b);
  });
  r.delete('/api/admin/brands/:id/products/:pid', req => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const p = productOf(b, req.params.pid!);
    b.products = b.products.filter(x => x.id !== p.id);
    audit(s, 'brand.product.delete', 'brand', b.id, `${b.name} › ${p.name}`);
    return adminBrandRow(b);
  });
  r.post('/api/admin/brands/:id/products/:pid/variants', (req: Req<BrandItemInput>) => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const p = productOf(b, req.params.pid!);
    const name = itemName(req.body.name, 'Variant');
    uniqueAmong(p.variants, name, null, 'Variant', p.name);
    p.variants.push({ id: id('VR'), name, categoryIds: checkedCategoryIds(req.body.categoryIds, false) });
    audit(s, 'brand.variant.add', 'brand', b.id, `${b.name} › ${p.name} › ${name}`);
    return adminBrandRow(b);
  });
  const variantOf = (p: Brand['products'][number], key: string) => {
    const v = p.variants.find(x => x.id === key);
    if (!v) throw notFound('Variant not found.');
    return v;
  };
  r.put('/api/admin/brands/:id/products/:pid/variants/:vid', (req: Req<BrandItemInput>) => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const p = productOf(b, req.params.pid!);
    const v = variantOf(p, req.params.vid!);
    const name = itemName(req.body.name, 'Variant');
    uniqueAmong(p.variants, name, v.id, 'Variant', p.name);
    v.categoryIds = checkedCategoryIds(req.body.categoryIds, false);
    audit(s, 'brand.variant.update', 'brand', b.id, `${b.name} › ${p.name} › ${v.name === name ? name : `${v.name} → ${name}`}`);
    v.name = name;
    return adminBrandRow(b);
  });
  r.delete('/api/admin/brands/:id/products/:pid/variants/:vid', req => {
    const s = adminOf(req, 'catalog.manage');
    const b = adminBrand(req.params.id!);
    const p = productOf(b, req.params.pid!);
    const v = variantOf(p, req.params.vid!);
    p.variants = p.variants.filter(x => x.id !== v.id);
    audit(s, 'brand.variant.delete', 'brand', b.id, `${b.name} › ${p.name} › ${v.name}`);
    return adminBrandRow(b);
  });

  type Actor = ReturnType<typeof adminOf>;
  /** Every SAC save stamps who changed it and when, and writes an audit event. */
  const saved = (s: Actor, sac: Db['sacs'][number], action: string, detail: string) => {
    sac.updatedAt = now();
    sac.updatedBy = s.user.name;
    audit(s, action, 'sac', sac.id, detail);
    return sacRow(sac);
  };
  const activeScreenCount = (sacId: string) => sacInventory(sacId, db().theatres, db().doohGroups).reduce((n, t) => n + t.screens.length, 0);

  r.post('/api/admin/sacs', (req: Req<SacInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const b = req.body;
    if (!b.name?.trim()) throw invalid('SAC name is required.');
    const urlError = sacUrlError(b.url ?? '', db().sacs);
    if (urlError) throw invalid(urlError);
    if (!b.adminName?.trim()) throw invalid('A SAC admin name is required.');
    if (!isEmail(b.adminEmail ?? '')) throw invalid('A valid SAC admin email is required.');
    if (b.supportEmail?.trim() && !isEmail(b.supportEmail)) throw invalid('Enter a valid support email.');
    const sac: Db['sacs'][number] = {
      id: id('SAC'), name: b.name.trim(), legalName: b.legalName?.trim() ?? '', location: { city: '', country: '' }, url: normaliseSacHost(b.url),
      supportEmail: b.supportEmail?.trim() || DEFAULT_SUPPORT_EMAIL, branding: defaultBranding(), contacts: emptyContacts(),
      billing: { companyName: '', address: '', taxIds: [], method: null, billingDay: null, frequency: null, currency: null },
      collections: { companyName: '', location: '', phone: '', email: '', taxIds: [] },
      // Inventory arrives with the first CinemaDB sync, once screens are mapped to this SAC there.
      exhibitorIds: [], lastSyncedAt: null, gateways: [], status: 'onboarding', createdAt: now(), updatedAt: now(), updatedBy: s.user.name
    };
    db().sacs.push(sac);
    db().screenHistory[sac.id] = {};
    db().users.push({ id: id('U'), name: b.adminName.trim(), email: b.adminEmail.trim(), phone: '', portal: 'sac', orgId: sac.id, role: 'sac_admin', status: 'invited', lastActiveAt: null });
    audit(s, 'sac.create', 'sac', sac.id, sac.name);
    return sacRow(sac);
  });
  r.put('/api/admin/sacs/:id/details', (req: Req<SacDetailsInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const b = req.body;
    if (!b.name?.trim()) throw invalid('SAC name is required.');
    Object.assign(sac, { name: b.name.trim(), legalName: (b.legalName ?? '').trim(), location: { city: (b.city ?? '').trim(), country: (b.country ?? '').trim() } });
    return saved(s, sac, 'sac.details', sac.name);
  });
  r.put('/api/admin/sacs/:id/setup', (req: Req<SacSetupInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const b = req.body;
    const urlError = sacUrlError(b.url ?? '', db().sacs.filter(x => x.id !== sac.id));
    if (urlError) throw invalid(urlError);
    if (b.supportEmail?.trim() && !isEmail(b.supportEmail)) throw invalid('Enter a valid support email.');
    for (const [label, v] of [['Header', b.headerColor], ['Primary', b.primaryColor], ['Secondary', b.secondaryColor]] as const) {
      if (!isHexColour(v ?? '')) throw invalid(`${label} colour must be a #RRGGBB hex value.`);
    }
    const primaryError = primaryColourError(b.primaryColor);
    if (primaryError) throw invalid(`Primary colour: ${primaryError}`);
    if (b.logo !== null && b.logo !== undefined) {
      if (!/^data:image\/(png|jpeg|svg\+xml)[;,]/.test(b.logo)) throw invalid('The logo must be a PNG, SVG or JPEG image.');
      if (b.logo.length > Math.ceil((LOGO_MAX_BYTES * 4) / 3) + 64) throw invalid('The logo must be 200 KB or smaller.');
    }
    Object.assign(sac, {
      url: normaliseSacHost(b.url), supportEmail: b.supportEmail?.trim() || DEFAULT_SUPPORT_EMAIL,
      branding: { headerColor: b.headerColor, primaryColor: b.primaryColor, secondaryColor: b.secondaryColor, logo: b.logo ?? null }
    });
    return saved(s, sac, 'sac.setup', `${sac.url}${b.logo ? ' · custom logo' : ''}`);
  });
  r.put('/api/admin/sacs/:id/contacts', (req: Req<SacContactsInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const next = emptyContacts();
    for (const { role, label } of CONTACT_ROLES) {
      next[role] = cleanContacts(req.body?.[role] ?? []);
      for (const c of next[role]) {
        const err = contactError(c);
        if (err) throw invalid(`${label}: ${err}`);
      }
    }
    sac.contacts = next;
    return saved(s, sac, 'sac.contacts', CONTACT_ROLES.map(({ role }) => next[role].length).join(' / ') + ' contacts');
  });
  r.put('/api/admin/sacs/:id/billing', (req: Req<SacBillingInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const b = req.body;
    const taxError = taxIdsError(b.taxIds ?? []);
    if (taxError) throw invalid(taxError);
    if (b.method && !BILLING_METHODS.some(m => m.value === b.method)) throw invalid('Choose a valid billing method.');
    if (b.frequency && !BILLING_FREQUENCIES.some(f => f.value === b.frequency)) throw invalid('Choose a valid billing frequency.');
    if (b.currency && !BILLING_CURRENCIES.includes(b.currency)) throw invalid('Choose a valid billing currency.');
    if (b.billingDay !== null && b.billingDay !== undefined && !(Number.isInteger(b.billingDay) && b.billingDay >= 1 && b.billingDay <= 28)) throw invalid('Billing date must be a day from 1 to 28.');
    sac.billing = {
      companyName: (b.companyName ?? '').trim(), address: (b.address ?? '').trim(), taxIds: cleanTaxIds(b.taxIds ?? []),
      method: b.method ?? null, billingDay: b.billingDay ?? null, frequency: b.frequency ?? null, currency: b.currency ?? null
    };
    return saved(s, sac, 'sac.billing', sac.billing.companyName || sac.name);
  });
  r.put('/api/admin/sacs/:id/collections', (req: Req<SacCollectionsInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const b = req.body;
    const taxError = taxIdsError(b.taxIds ?? []);
    if (taxError) throw invalid(taxError);
    if (b.email?.trim() && !isEmail(b.email)) throw invalid('Enter a valid company email.');
    sac.collections = {
      companyName: (b.companyName ?? '').trim(), location: (b.location ?? '').trim(), phone: (b.phone ?? '').trim(),
      email: (b.email ?? '').trim(), taxIds: cleanTaxIds(b.taxIds ?? [])
    };
    return saved(s, sac, 'sac.collections', sac.collections.companyName || sac.name);
  });
  r.put('/api/admin/sacs/:id/status', (req: Req<SacStatusInput>) => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const status = req.body?.status;
    if (status !== 'active' && status !== 'inactive' && status !== 'onboarding') throw invalid('Unknown status.');
    if (status === sac.status) throw invalid(`${sac.name} is already ${status}.`);
    const from = sac.status;
    sac.status = status;
    return saved(s, sac, 'sac.status', `${from} to ${status}`);
  });
  r.get('/api/admin/sacs/:id/active-screens', (req): SacActiveScreens => {
    adminOf(req);
    const sac = find(db().sacs, req.params.id!, 'SAC');
    return screenHistoryGrid(db().screenHistory[sac.id] ?? {}, sac.createdAt, now());
  });

  // ---- payment gateways (the SAC's collections) ----
  const gatewayOf = (req: Req) => {
    const s = adminOf(req, 'gateway.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    return { s, sac, gw: req.params.gid ? find(sac.gateways, req.params.gid, 'Gateway') : null };
  };
  const keyHintOf = (key: string | null | undefined, prev: { provider: string; keyHint: string } | null, provider: string) =>
    key ? '••••' + key.slice(-4) : prev && prev.provider === provider ? prev.keyHint : '';
  const gatewayLabel = (g: { provider: string; mode: string; enabled: boolean }) => `${g.provider} ${g.mode} ${g.enabled ? 'enabled' : 'disabled'}`;
  r.post('/api/admin/sacs/:id/gateways', (req: Req<GatewayInput>) => {
    const { s, sac } = gatewayOf(req);
    const b = req.body;
    const err = gatewayError({ provider: b.provider, mode: b.mode, merchantId: b.merchantId ?? '', enabled: b.enabled }, null, b.secretKey);
    if (err) throw invalid(err);
    const dates = stampGatewayDates(null, b, now());
    sac.gateways = addGateway(sac.gateways, {
      id: id('GW'), provider: b.provider, mode: b.mode, merchantId: (b.merchantId ?? '').trim(), keyHint: keyHintOf(b.secretKey, null, b.provider),
      enabled: b.enabled, isDefault: false, ...dates, updatedAt: now()
    });
    return saved(s, sac, 'gateway.add', gatewayLabel(b));
  });
  r.put('/api/admin/sacs/:id/gateways/:gid', (req: Req<GatewayInput>) => {
    const { s, sac, gw } = gatewayOf(req);
    const b = req.body;
    const err = gatewayError({ provider: b.provider, mode: b.mode, merchantId: b.merchantId ?? '', enabled: b.enabled }, gw!, b.secretKey);
    if (err) throw invalid(err);
    Object.assign(gw!, {
      provider: b.provider, mode: b.mode, merchantId: (b.merchantId ?? '').trim(), enabled: b.enabled, updatedAt: now(),
      keyHint: keyHintOf(b.secretKey, gw, b.provider), ...stampGatewayDates(gw, b, now())
    });
    return saved(s, sac, 'gateway.update', `${gatewayLabel(b)}${b.secretKey ? ' · key rotated' : ''}`);
  });
  r.post('/api/admin/sacs/:id/gateways/:gid/default', req => {
    const { s, sac, gw } = gatewayOf(req);
    sac.gateways = setDefaultGateway(sac.gateways, gw!.id);
    return saved(s, sac, 'gateway.default', `${gw!.provider} ${gw!.mode}`);
  });
  r.post('/api/admin/sacs/:id/gateways/:gid/enabled', (req: Req<{ enabled: boolean }>) => {
    const { s, sac, gw } = gatewayOf(req);
    const enabled = !!req.body?.enabled;
    const draft = { provider: gw!.provider, mode: gw!.mode, merchantId: gw!.merchantId, enabled };
    const err = gatewayError(draft, gw!, null);
    if (err) throw invalid(err);
    Object.assign(gw!, { enabled, updatedAt: now(), ...stampGatewayDates(gw, draft, now()) });
    return saved(s, sac, enabled ? 'gateway.enable' : 'gateway.disable', gatewayLabel(gw!));
  });
  r.delete('/api/admin/sacs/:id/gateways/:gid', req => {
    const { s, sac, gw } = gatewayOf(req);
    sac.gateways = removeGateway(sac.gateways, gw!.id);
    return saved(s, sac, 'gateway.delete', `${gw!.provider} ${gw!.mode}`);
  });
  /** Theatres where this SAC has screens or DOOH mapped (any status), with the counts attributed to it. */
  r.get('/api/admin/sacs/:id/theatres', (req): SacTheatresPage => {
    adminOf(req);
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const q = (req.query.get('q') ?? '').trim().toLowerCase();
    const chain = req.query.get('chain');
    const location = req.query.get('location');
    const status = req.query.get('status');
    const page = Math.max(1, Number(req.query.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(req.query.get('pageSize')) || 25));
    const dooh = byKey(db().doohGroups.filter(g => g.sacId === sac.id), g => g.theatreId);
    const all: SacTheatreRow[] = [];
    for (const t of db().theatres) {
      const mine = t.screens.filter(s => s.sacId === sac.id);
      const groups = dooh.get(t.id) ?? [];
      if (!mine.length && !groups.length) continue;
      all.push({
        theatreId: t.id, name: t.name, city: t.city, state: t.state, country: t.country, chain: t.brand, status: t.status,
        screensTotal: t.screens.length, screensForSac: mine.length, category: t.category,
        formats: [...new Set(mine.map(s => s.format).filter(f => f !== 'Standard'))],
        doohScreens: groups.reduce((n, g) => n + g.screens, 0), doohGroups: groups.length
      });
    }
    const facet = <K extends string>(rows: SacTheatreRow[], key: (r: SacTheatreRow) => K) => {
      const m = new Map<K, number>();
      for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
      return [...m].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    };
    const rows = all.filter(r =>
      (!q || `${r.name} ${r.city} ${r.state} ${r.country}`.toLowerCase().includes(q)) &&
      (!chain || r.chain === chain) && (!location || r.city === location) && (!status || r.status === status));
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return {
      rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize,
      totals: {
        theatres: all.length, activeTheatres: all.filter(r => r.status === 'active').length,
        screens: all.reduce((n, r) => n + r.screensForSac, 0), doohScreens: all.reduce((n, r) => n + r.doohScreens, 0)
      },
      facets: { chains: facet(all, r => r.chain), locations: facet(all, r => r.city), statuses: facet(all, r => r.status) },
      lastSyncedAt: sac.lastSyncedAt
    };
  });
  /**
   * Mock of the CinemaDB pull: maps a few pending screens in theatres this SAC already sells,
   * releases one screen, and records the sync. The real integration replaces this handler.
   */
  r.post('/api/admin/sacs/:id/sync', (req): SacSyncResult => {
    const s = adminOf(req, 'tenants.manage');
    const sac = find(db().sacs, req.params.id!, 'SAC');
    const sold = db().theatres.filter(t => t.screens.some(x => x.sacId === sac.id));
    const pending = sold.flatMap(t => t.screens.filter(x => x.sacId === null));
    const added = pending.slice(0, 1 + (Date.now() % 5));
    added.forEach(x => { x.sacId = sac.id; });
    const releasable = sold.flatMap(t => t.screens.filter(x => x.sacId === sac.id)).filter(x => !added.includes(x));
    const removed = releasable.length > 20 && Date.now() % 3 === 0 ? [releasable[Date.now() % releasable.length]!] : [];
    removed.forEach(x => { x.sacId = null; });
    sac.exhibitorIds = exhibitorsOf(sac.id, db().theatres, db().doohGroups);
    sac.lastSyncedAt = now();
    const detail = `CinemaDB sync: ${added.length} screen${added.length === 1 ? '' : 's'} mapped, ${removed.length} released`;
    (db().screenHistory[sac.id] ??= {})[monthKey(now())] = activeScreenCount(sac.id);
    saved(s, sac, 'sac.sync', detail);
    return { added: added.length, removed: removed.length, lastSyncedAt: sac.lastSyncedAt };
  });
  r.get('/api/admin/users', req => { adminOf(req); return db().users; });
  r.get('/api/admin/theatres', req => {
    adminOf(req);
    const groups = byKey(db().doohGroups, g => g.theatreId);
    const exName = new Map(db().exhibitors.map(e => [e.id, e.name]));
    return db().theatres.map(t => ({ ...t, exhibitorName: exName.get(t.exhibitorId)!, doohGroups: groups.get(t.id) ?? [], doohStatus: groups.has(t.id) ? 'Configured' : 'Pending' }));
  });
  r.get('/api/admin/devices', (req): DeviceRow[] => {
    adminOf(req);
    const theatre = new Map(db().theatres.map(t => [t.id, t]));
    const exName = new Map(db().exhibitors.map(e => [e.id, e.name]));
    return db().devices.map(d => {
      const t = theatre.get(d.theatreId)!;
      return { ...d, theatreName: t.name, city: t.city, exhibitorName: exName.get(t.exhibitorId)!, health: deviceHealth(d, Date.now()) };
    });
  });
  r.get('/api/admin/ingestion', (req): IngestionRow[] => {
    adminOf(req);
    const devices = byKey(db().devices, d => d.theatreId);
    const delivery = byKey(db().delivery, d => d.theatreId);
    const exName = new Map(db().exhibitors.map(e => [e.id, e.name]));
    return db().theatres.filter(t => t.status !== 'closed').map(t => ({
      ...ingestionFor(t.id, devices.get(t.id) ?? [], delivery.get(t.id) ?? [], Date.now()),
      theatreName: t.name, city: t.city, exhibitorName: exName.get(t.exhibitorId)!
    }));
  });
  r.get('/api/admin/advertisers', req => { adminOf(req); return db().companies.map(c => ({ ...advertiserRow(c), sacName: db().sacs.find(s => s.id === c.sacId)!.name })); });
  r.get('/api/admin/campaigns', req => { adminOf(req); return db().campaigns.map(c => ({ ...campaignRow(c), sacName: db().sacs.find(s => s.id === c.sacId)!.name })); });
  r.get('/api/admin/audit', req => { adminOf(req); return db().audit.slice(0, 500); });
  r.post('/api/admin/impersonate', (req: Req<{ userId: string; reason: string }>) => {
    const s = adminOf(req, 'impersonate');
    const target = find(db().users, req.body.userId, 'User');
    if (target.portal === 'admin') throw invalid('Admins cannot be impersonated.');
    if (!req.body.reason?.trim()) throw invalid('A support reason is required.');
    audit(s, 'impersonate.start', 'user', target.id, `As ${target.name} (${target.portal}) — ${req.body.reason}`);
    return { userId: target.id, impersonatorId: s.user.id, portal: target.portal };
  });

  return r;
}

export { createSeed };
