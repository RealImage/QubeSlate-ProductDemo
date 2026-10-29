import {
  DOOH_TYPES, quotePlacement, resolveReach, statusOnApproval, withGst,
  type AuditEvent, type Brand, type Campaign, type Company, type DeliveryRecord, type Device, type DoohGroup,
  type CinemaSpot, type Exhibitor, type Invoice, type Media, type Placement, type PlacementPosition, type Sac, type Screen,
  type TargetGroup, type Theatre, type User
} from '@slate/domain';

export interface Db {
  exhibitors: Exhibitor[];
  sacs: Sac[];
  theatres: Theatre[];
  doohGroups: DoohGroup[];
  devices: Device[];
  companies: Company[];
  brands: Brand[];
  users: User[];
  targetGroups: TargetGroup[];
  media: Media[];
  campaigns: Campaign[];
  placements: Placement[];
  delivery: DeliveryRecord[];
  invoices: Invoice[];
  audit: AuditEvent[];
  seq: number;
}

// Deterministic PRNG so every reset produces the same network.
function rng(seed: number) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const DAY = 86_400_000;
export const today = () => new Date().toISOString().slice(0, 10);
const d = (offset: number) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
const at = (offset: number, hour = 11) => new Date(Date.parse(d(offset)) + hour * 3_600_000).toISOString();

const HOURS = Array.from({ length: 7 }, (_, i) => (i >= 4 ? { open: '08:30', close: '01:30' } : { open: '09:00', close: '23:45' }));

const IN = (state: string) => ({ state, country: 'India' });
const CITY = {
  Mumbai: IN('Maharashtra'), Pune: IN('Maharashtra'), 'Delhi NCR': IN('Delhi'), Bengaluru: IN('Karnataka'), Hyderabad: IN('Telangana'),
  Chennai: IN('Tamil Nadu'), Kolkata: IN('West Bengal'), Ahmedabad: IN('Gujarat'), Indore: IN('Madhya Pradesh'), Lucknow: IN('Uttar Pradesh'),
  Kochi: IN('Kerala'), Vijayawada: IN('Andhra Pradesh'), Jaipur: IN('Rajasthan'), Chandigarh: IN('Chandigarh'), Nagpur: IN('Maharashtra'),
  Amsterdam: { state: 'North Holland', country: 'Netherlands' }, Rotterdam: { state: 'South Holland', country: 'Netherlands' },
  Brussels: { state: 'Brussels-Capital', country: 'Belgium' }, Antwerp: { state: 'Antwerp', country: 'Belgium' },
  Tokyo: { state: 'Tokyo', country: 'Japan' }, Osaka: { state: 'Osaka', country: 'Japan' },
  Jakarta: { state: 'DKI Jakarta', country: 'Indonesia' }, Surabaya: { state: 'East Java', country: 'Indonesia' },
  'New York': { state: 'New York', country: 'USA' }, 'Los Angeles': { state: 'California', country: 'USA' },
  Dallas: { state: 'Texas', country: 'USA' }, Phoenix: { state: 'Arizona', country: 'USA' }, Milwaukee: { state: 'Wisconsin', country: 'USA' }
} as const;
type City = keyof typeof CITY;

function buildNetwork() {
  const r = rng(42);
  const exhibitors: Exhibitor[] = [
    { id: 'EX-PVR', name: 'PVR INOX Ltd', code: 'PVRINOX', hq: 'Gurugram', createdAt: at(-400) },
    { id: 'EX-STR', name: 'Starlite Cinemas', code: 'STARLITE', hq: 'Ahmedabad', createdAt: at(-300) },
    { id: 'EX-AUR', name: 'Aurora Multiplex', code: 'AURORA', hq: 'Kochi', createdAt: at(-120) },
    { id: 'EX-CPI', name: 'Cinépolis India', code: 'CINEPOLIS-IN', hq: 'Mumbai', createdAt: at(-260) },
    { id: 'EX-PTH', name: 'Pathé Nederland', code: 'PATHE-NL', hq: 'Amsterdam', createdAt: at(-150) },
    { id: 'EX-KIN', name: 'Kinepolis Belgium', code: 'KINEPOLIS-BE', hq: 'Brussels', createdAt: at(-140) },
    { id: 'EX-TOH', name: 'Toho Cinemas', code: 'TOHO-JP', hq: 'Tokyo', createdAt: at(-60) },
    { id: 'EX-CPID', name: 'Cinépolis Indonesia', code: 'CINEPOLIS-ID', hq: 'Jakarta', createdAt: at(-45) },
    { id: 'EX-AMC', name: 'AMC Theatres', code: 'AMC-US', hq: 'Leawood', createdAt: at(-220) },
    { id: 'EX-CMK', name: 'Cinemark USA', code: 'CINEMARK-US', hq: 'Plano', createdAt: at(-210) },
    { id: 'EX-HRK', name: 'Harkins Theatres', code: 'HARKINS-US', hq: 'Scottsdale', createdAt: at(-180) },
    { id: 'EX-MRC', name: 'Marcus Theatres', code: 'MARCUS-US', hq: 'Milwaukee', createdAt: at(-170) }
  ];
  const plan: [string, string, City, Theatre['category']][] = [
    ['EX-PVR', 'PVR ICON Phoenix Palladium', 'Mumbai', 'Premium'], ['EX-PVR', 'INOX Megaplex Inorbit', 'Mumbai', 'Premium'],
    ['EX-PVR', 'PVR Juhu', 'Mumbai', 'Mainstream'], ['EX-PVR', 'PVR Director’s Cut Ambience', 'Delhi NCR', 'Premium'],
    ['EX-PVR', 'PVR Select Citywalk', 'Delhi NCR', 'Premium'], ['EX-PVR', 'INOX Nehru Place', 'Delhi NCR', 'Mainstream'],
    ['EX-PVR', 'PVR Orion Mall', 'Bengaluru', 'Premium'], ['EX-PVR', 'INOX Garuda', 'Bengaluru', 'Mainstream'],
    ['EX-PVR', 'PVR Nexus Hyderabad', 'Hyderabad', 'Premium'], ['EX-PVR', 'INOX GVK One', 'Hyderabad', 'Mainstream'],
    ['EX-PVR', 'PVR Grand Galada', 'Chennai', 'Mainstream'], ['EX-PVR', 'INOX South City', 'Kolkata', 'Mainstream'],
    ['EX-PVR', 'PVR Phoenix Marketcity', 'Pune', 'Premium'], ['EX-PVR', 'INOX C21', 'Indore', 'Value'],
    ['EX-PVR', 'PVR Phoenix Palassio', 'Lucknow', 'Mainstream'], ['EX-PVR', 'PVR Lulu', 'Kochi', 'Premium'],
    ['EX-PVR', 'INOX Trendset', 'Vijayawada', 'Value'], ['EX-PVR', 'PVR Elante', 'Chandigarh', 'Mainstream'],
    ['EX-STR', 'Starlite Alpha One', 'Ahmedabad', 'Mainstream'], ['EX-STR', 'Starlite Iscon', 'Ahmedabad', 'Value'],
    ['EX-STR', 'Starlite World Trade Park', 'Jaipur', 'Mainstream'], ['EX-STR', 'Starlite Treasure Island', 'Indore', 'Value'],
    ['EX-AUR', 'Aurora Centre Square', 'Kochi', 'Mainstream'], ['EX-AUR', 'Aurora Forum', 'Chennai', 'Value'],
    ['EX-CPI', 'Cinépolis Seasons Mall', 'Pune', 'Premium'], ['EX-CPI', 'Cinépolis VR Nagpur', 'Nagpur', 'Mainstream'],
    ['EX-PTH', 'Pathé Tuschinski', 'Amsterdam', 'Premium'], ['EX-PTH', 'Pathé Schouwburgplein', 'Rotterdam', 'Mainstream'],
    ['EX-KIN', 'Kinepolis Brussel', 'Brussels', 'Premium'], ['EX-KIN', 'Kinepolis Antwerpen', 'Antwerp', 'Mainstream'],
    ['EX-TOH', 'Toho Cinemas Shinjuku', 'Tokyo', 'Premium'], ['EX-TOH', 'Toho Cinemas Umeda', 'Osaka', 'Mainstream'],
    ['EX-CPID', 'Cinépolis Plaza Senayan', 'Jakarta', 'Premium'], ['EX-CPID', 'Cinépolis Pakuwon Mall', 'Surabaya', 'Mainstream'],
    ['EX-AMC', 'AMC Lincoln Square 13', 'New York', 'Premium'], ['EX-AMC', 'AMC Century City 15', 'Los Angeles', 'Premium'],
    ['EX-CMK', 'Cinemark West Plano XD', 'Dallas', 'Mainstream'], ['EX-HRK', 'Harkins Arizona Center 24', 'Phoenix', 'Mainstream'],
    ['EX-MRC', 'Marcus Majestic Cinema', 'Milwaukee', 'Value']
  ];
  const brandOf = (n: string) => n.split(' ').slice(0, n.startsWith('PVR ICON') || n.startsWith('PVR Director') ? 2 : 1).join(' ').replace('’s', '’s Cut');
  const theatres: Theatre[] = plan.map(([exhibitorId, name, city, category], i) => {
    const id = `TH-${101 + i}`;
    const count = category === 'Premium' ? 6 + Math.floor(r() * 4) : category === 'Mainstream' ? 4 + Math.floor(r() * 3) : 3 + Math.floor(r() * 2);
    const screens: Screen[] = Array.from({ length: count }, (_, s) => {
      const special = category === 'Premium' ? (['IMAX', '4DX', 'Recliner', 'Onyx LED', 'ScreenX'] as const)[s] : s === 0 && category === 'Mainstream' ? 'Recliner' : undefined;
      return {
        id: `${id}-S${s + 1}`, theatreId: id, name: `Audi ${s + 1}`, format: special ?? 'Standard',
        category: special ? 'Gold' : s % 3 === 0 ? 'Silver' : 'Standard',
        projection: category === 'Value' ? '2K' : r() > 0.3 ? '4K' : '2K',
        sound: special ? 'Atmos' : r() > 0.5 ? '7.1' : '5.1', seats: 120 + Math.floor(r() * 260)
      };
    });
    return {
      id, exhibitorId, name, brand: exhibitorId === 'EX-PVR' ? brandOf(name) : exhibitors.find(e => e.id === exhibitorId)!.name,
      city, state: CITY[city].state, country: CITY[city].country, category, screens, hours: HOURS,
      updatedAt: at(-Math.floor(r() * 60), 9 + (i % 8)), updatedBy: i % 3 ? 'Rohan Mehta' : 'Sana Qureshi'
    };
  });

  // DOOH is configured at roughly two-thirds of theatres; the rest show as Pending in the SAC.
  const doohGroups: DoohGroup[] = [];
  theatres.forEach((t, i) => {
    if (i % 3 === 2) return;
    const types = DOOH_TYPES.filter((_, k) => r() < (k < 4 ? 0.8 : 0.25));
    types.forEach((type, k) => {
      const screens = 1 + Math.floor(r() * (type === 'Lobby' || type === 'Foyer' ? 8 : 3));
      doohGroups.push({
        id: `DG-${t.id}-${k + 1}`, theatreId: t.id, type, name: `${type.split(' ')[0]} ${k % 2 ? 'East' : 'Main'}`,
        screens, orientation: r() > 0.7 ? 'Vertical' : 'Horizontal',
        mode: screens > 3 ? 'Synchronized Screens' : 'Independent Screens',
        loop: r() > 0.4 ? 'Scheduled' : 'Synchronized with Screen', loopSecs: 120
      });
    });
  });

  const devices: Device[] = [];
  for (const t of theatres) {
    // A couple of theatres have stale or offline log uploads, so ingestion health has something to show.
    const lag = t.id === 'TH-111' ? 30 : t.id === 'TH-117' ? 5 : 0;
    for (const s of t.screens) {
      devices.push({
        id: `DV-${s.id}`, theatreId: t.id, screenId: s.id, doohGroupId: null, kind: 'cinema-server',
        model: r() > 0.5 ? 'Qube XP-D 4K' : 'Qube XP-I', serial: `QXP${Math.floor(r() * 1e6)}`,
        lastSeenAt: new Date(Date.now() - (lag * 3_600_000 + r() * 1_800_000)).toISOString(),
        lastLogAt: new Date(Date.now() - (lag * 3_600_000 + r() * 3_600_000)).toISOString()
      });
    }
    for (const g of doohGroups.filter(g => g.theatreId === t.id)) {
      devices.push({
        id: `DV-${g.id}`, theatreId: t.id, screenId: null, doohGroupId: g.id, kind: 'dooh-player',
        model: 'Qube Wire Player', serial: `QWP${Math.floor(r() * 1e6)}`,
        lastSeenAt: new Date(Date.now() - (lag * 3_600_000 + r() * 2_400_000)).toISOString(),
        lastLogAt: new Date(Date.now() - (lag * 3_600_000 + r() * 3_600_000)).toISOString()
      });
    }
  }
  return { exhibitors, theatres, doohGroups, devices };
}

const emptyGeo = (): TargetGroup['geo'] => ({ countries: [], states: [], cities: [], theatreIds: [], screenIds: [], theatreCategories: [], screenCategories: [], formats: [] });
const noInterest = () => ({ genres: [], ratings: [], languages: [] });
const noAdvanced = () => ({ movies: [], actors: [] });
const docs = (status: 'verified' | 'uploaded' | 'missing'): Company['kycDocs'] =>
  (['GST certificate', 'PAN card', 'Certificate of incorporation', 'Authorised signatory ID'] as const).map((kind, i) => ({
    kind,
    fileName: status === 'missing' && i > 1 ? null : `${kind.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    uploadedAt: status === 'missing' && i > 1 ? null : at(-30 - i),
    status: status === 'missing' && i > 1 ? 'missing' : status
  }));

export function createSeed(): Db {
  const { exhibitors, theatres, doohGroups, devices } = buildNetwork();

  // Payment gateways here are India-only (Razorpay / PayU / CCAvenue); other markets stay on the stub until a local gateway is added.
  const sac = (id: string, name: string, legalName: string, slug: string, taxId: string, exhibitorIds: string[], status: Sac['status'], ago: number,
    gw?: Omit<Sac['gateway'], 'updatedAt'>): Sac => ({
    id, name, legalName, slug, gstin: taxId, supportEmail: `adsales@${slug}.example`, exhibitorIds, status, createdAt: at(ago),
    gateway: { ...(gw ?? { provider: 'stub' as const, mode: 'test' as const, merchantId: '', keyHint: '', enabled: false }), updatedAt: at(ago + 5) }
  });
  const sacs: Sac[] = [
    {
      id: 'SAC-PVRM', name: 'PVR INOX Media Sales', legalName: 'PVR INOX Ltd (Media Sales)', slug: 'pvrinox-media',
      gstin: '06AAACP4526D1Z1', supportEmail: 'adsales@pvrinox.example', exhibitorIds: ['EX-PVR'], status: 'active', createdAt: at(-380),
      gateway: { provider: 'razorpay', mode: 'test', merchantId: 'rzp_test_PVRM01', keyHint: '••••Q8x1', enabled: true, updatedAt: at(-20) }
    },
    {
      id: 'SAC-QCN', name: 'Qube Cinema Network', legalName: 'Qube Cinema Technologies Pvt Ltd (Cinema Network)', slug: 'qube-cinema-network',
      gstin: '33AABCQ1234M1Z5', supportEmail: 'adsales@qubecinemanetwork.example', exhibitorIds: ['EX-STR', 'EX-AUR'], status: 'active', createdAt: at(-200),
      gateway: { provider: 'payu', mode: 'test', merchantId: 'payu_test_QCN', keyHint: '••••a91c', enabled: false, updatedAt: at(-90) }
    },
    sac('SAC-CPAI', 'Cinépolis Advertising India', 'Cinépolis India Pvt Ltd (Advertising)', 'cinepolis-advertising-in', '27AAECC4410R1ZQ', ['EX-CPI'], 'active', -240,
      { provider: 'ccavenue', mode: 'test', merchantId: 'ccav_test_CPAI', keyHint: '••••7d20', enabled: true }),
    sac('SAC-CMC', 'CMC Media', 'CMC Media B.V.', 'cmc-media', 'NL859214378B01', ['EX-PTH'], 'active', -130),
    sac('SAC-BRF', 'Brightfish Media', 'Brightfish NV', 'brightfish', 'BE0456812937', ['EX-KIN'], 'active', -125),
    sac('SAC-BRD', 'Broad Media', 'Broad Media Co., Ltd.', 'broad-media', 'T4011001049183', ['EX-TOH'], 'onboarding', -20),
    sac('SAC-CPAD', 'Cinépolis Advertising Indonesia', 'PT Cinemaxx Global Pasifik (Advertising)', 'cinepolis-advertising-id', '01.234.567.8-091.000', ['EX-CPID'], 'onboarding', -15),
    sac('SAC-SVM', 'Screenvision Media', 'Screenvision Media LLC', 'screenvision', '13-4129755', ['EX-HRK', 'EX-CMK'], 'active', -200),
    sac('SAC-SDL', 'Screen Dollars', 'Screen Dollars Inc.', 'screen-dollars', '47-2913385', ['EX-MRC'], 'active', -110),
    sac('SAC-NCM', 'National CineMedia', 'National CineMedia LLC', 'ncm', '20-5665602', ['EX-AMC', 'EX-CMK'], 'active', -210)
  ];

  const companies: Company[] = [
    {
      id: 'CO-MER', sacId: 'SAC-PVRM', code: 'ADV-10428', name: 'Meridian Media India Pvt Ltd', gstin: '27AAKCM8812L1Z4', pan: 'AAKCM8812L',
      address: '4th Floor, Kamala Mills, Lower Parel, Mumbai 400013', kycStatus: 'approved', kycDocs: docs('verified'),
      kycSubmittedAt: at(-60), kycReviewedAt: at(-58), kycNote: null, billingType: 'card', contract: null, inventoryAccess: { mode: 'full' },
      contacts: [
        { id: 'CT-1', role: 'Primary', name: 'Aditi Rao', email: 'aditi.rao@meridianmedia.example', phone: '+91 98200 41120' },
        { id: 'CT-2', role: 'Billing', name: 'Farhan Shaikh', email: 'accounts@meridianmedia.example', phone: '+91 98200 55871' }
      ],
      createdAt: at(-62)
    },
    {
      id: 'CO-NWD', sacId: 'SAC-PVRM', code: 'ADV-10311', name: 'Northwind Consumer Brands Ltd', gstin: '29AACCN4410P1Z2', pan: 'AACCN4410P',
      address: 'Prestige Tech Park, Outer Ring Road, Bengaluru 560103', kycStatus: 'approved', kycDocs: docs('verified'),
      kycSubmittedAt: at(-200), kycReviewedAt: at(-198), kycNote: null, billingType: 'contracted',
      contract: { ref: 'PVRM/NWD/2026-27', creditLimit: 25_000_000, paymentTermsDays: 45, validUntil: d(150) },
      inventoryAccess: { mode: 'full' },
      contacts: [{ id: 'CT-3', role: 'Primary', name: 'Vikram Desai', email: 'vikram.desai@northwind.example', phone: '+91 99001 22314' }],
      createdAt: at(-210)
    },
    {
      id: 'CO-SUN', sacId: 'SAC-PVRM', code: 'ADV-10533', name: 'Sunrise Foods & Beverages LLP', gstin: '33AAQFS2290G1Z9', pan: 'AAQFS2290G',
      address: 'Guindy Industrial Estate, Chennai 600032', kycStatus: 'pending', kycDocs: docs('uploaded'),
      kycSubmittedAt: at(-2), kycReviewedAt: null, kycNote: null, billingType: null, contract: null, inventoryAccess: { mode: 'full' },
      contacts: [{ id: 'CT-4', role: 'Primary', name: 'Lakshmi Narayanan', email: 'lakshmi@sunrisefoods.example', phone: '+91 94440 11872' }],
      createdAt: at(-3)
    },
    {
      id: 'CO-KAI', sacId: 'SAC-QCN', code: 'ADV-20017', name: 'Kairos Retail Pvt Ltd', gstin: '24AAICK9031M1Z7', pan: 'AAICK9031M',
      address: 'SG Highway, Ahmedabad 380054', kycStatus: 'approved', kycDocs: docs('verified'),
      kycSubmittedAt: at(-80), kycReviewedAt: at(-79), kycNote: null, billingType: 'card', contract: null,
      inventoryAccess: { mode: 'restricted', exhibitorIds: ['EX-STR'], theatreIds: [] },
      contacts: [{ id: 'CT-5', role: 'Primary', name: 'Dhruv Patel', email: 'dhruv@kairosretail.example', phone: '+91 98250 77310' }],
      createdAt: at(-82)
    }
  ];

  const brand = (id: string, companyId: string, name: string, category: string, status: Brand['status'] = 'approved', ago = 50): Brand =>
    ({ id, companyId, name, category, status, requestedAt: at(-ago), reviewedAt: status === 'pending' ? null : at(-ago + 1), note: null });
  const brands: Brand[] = [
    brand('BR-TAN', 'CO-MER', 'Tanishq', 'Jewellery'), brand('BR-RE', 'CO-MER', 'Royal Enfield', 'Automotive'),
    brand('BR-AMUL', 'CO-MER', 'Amul', 'FMCG — Dairy'), brand('BR-K811', 'CO-MER', 'Kotak 811', 'BFSI'),
    brand('BR-SUG', 'CO-MER', 'Sugar Cosmetics', 'Beauty', 'pending', 3),
    brand('BR-NWA', 'CO-NWD', 'Northwind Air', 'Consumer durables'), brand('BR-NWC', 'CO-NWD', 'Northwind Chill', 'Beverages'),
    brand('BR-SUN', 'CO-SUN', 'Sunrise Filter Coffee', 'Beverages', 'pending', 2),
    brand('BR-KAI', 'CO-KAI', 'Kairos Fresh', 'Retail')
  ];

  const u = (id: string, name: string, portal: User['portal'], orgId: string, role: User['role'], status: User['status'] = 'active'): User => ({
    id, name, portal, orgId, role, status,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${portal === 'admin' ? 'qubecinema.example' : orgId.toLowerCase() + '.example'}`,
    phone: '+91 98' + String(id.length * 7_131_117).slice(0, 8), lastActiveAt: status === 'active' ? at(-1, 15) : null
  });
  const users: User[] = [
    u('U-ADITI', 'Aditi Rao', 'advertiser', 'CO-MER', 'admin'), u('U-NEHA', 'Neha Bhatt', 'advertiser', 'CO-MER', 'planner'),
    u('U-KAVYA', 'Kavya Pillai', 'advertiser', 'CO-MER', 'planner'), u('U-ARJUN', 'Arjun Menon', 'advertiser', 'CO-MER', 'viewer', 'invited'),
    u('U-VIKRAM', 'Vikram Desai', 'advertiser', 'CO-NWD', 'admin'), u('U-LAKSHMI', 'Lakshmi Narayanan', 'advertiser', 'CO-SUN', 'admin'),
    u('U-DHRUV', 'Dhruv Patel', 'advertiser', 'CO-KAI', 'admin'),
    u('U-ROHAN', 'Rohan Mehta', 'sac', 'SAC-PVRM', 'ad_ops'), u('U-SANA', 'Sana Qureshi', 'sac', 'SAC-PVRM', 'sac_admin'),
    u('U-PRIYA', 'Priya Raman', 'sac', 'SAC-PVRM', 'finance'), u('U-ISHA', 'Isha Kapoor', 'sac', 'SAC-QCN', 'sac_admin'),
    u('U-RAHUL', 'Rahul Shetty', 'sac', 'SAC-CPAI', 'sac_admin'), u('U-SANNE', 'Sanne de Vries', 'sac', 'SAC-CMC', 'sac_admin'),
    u('U-LIES', 'Lies Peeters', 'sac', 'SAC-BRF', 'sac_admin'), u('U-KENJI', 'Kenji Watanabe', 'sac', 'SAC-BRD', 'sac_admin', 'invited'),
    u('U-PUTRI', 'Putri Wulandari', 'sac', 'SAC-CPAD', 'sac_admin', 'invited'), u('U-MEGAN', 'Megan Brooks', 'sac', 'SAC-SVM', 'sac_admin'),
    u('U-CARLOS', 'Carlos Rivera', 'sac', 'SAC-SDL', 'sac_admin'), u('U-JORDAN', 'Jordan Hayes', 'sac', 'SAC-NCM', 'sac_admin'),
    u('U-HARSHIT', 'Harshit Thakkar', 'admin', 'qube', 'qube_admin'), u('U-MEERA', 'Meera Iyer', 'admin', 'qube', 'qube_support')
  ];

  const tg = (id: string, companyId: string, name: string, over: Partial<TargetGroup>, ago: number): TargetGroup => ({
    id, companyId, name, channel: 'cinema', geo: emptyGeo(), interest: noInterest(), advanced: noAdvanced(), doohTypes: [],
    createdAt: at(-ago - 10), updatedAt: at(-ago), ...over
  });
  const targetGroups: TargetGroup[] = [
    tg('TG-1', 'CO-MER', 'Metro Premium — Gold', {
      geo: { ...emptyGeo(), cities: ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Kochi'], theatreCategories: ['Premium'], formats: ['IMAX', '4DX', 'Recliner', 'Onyx LED'] },
      interest: { genres: [], ratings: [], languages: ['Hindi', 'English'] }
    }, 14),
    tg('TG-2', 'CO-MER', 'Tier-2 Family Weekend', {
      geo: { ...emptyGeo(), cities: ['Indore', 'Lucknow', 'Kochi', 'Vijayawada', 'Chandigarh'], formats: ['Standard'] },
      interest: { genres: ['Family', 'Comedy'], ratings: ['U', 'UA'], languages: ['Hindi'] }
    }, 20),
    tg('TG-3', 'CO-MER', 'South Multiplex — Telugu', {
      geo: { ...emptyGeo(), states: ['Telangana', 'Andhra Pradesh'] },
      interest: { genres: ['Action', 'Drama'], ratings: [], languages: ['Telugu'] }
    }, 27),
    tg('TG-4', 'CO-MER', 'Youth Action Genre', {
      geo: { ...emptyGeo(), formats: ['4DX', 'IMAX'] },
      interest: { genres: ['Action', 'Sci-fi'], ratings: [], languages: ['English', 'Hindi'] }
    }, 32),
    tg('TG-5', 'CO-MER', 'Metro Lobby Screens', {
      channel: 'dooh', geo: { ...emptyGeo(), cities: ['Mumbai', 'Delhi NCR', 'Bengaluru'] }, doohTypes: ['Lobby', 'Foyer', 'Concessions']
    }, 6),
    tg('TG-6', 'CO-NWD', 'Pan-India Mainstream', { geo: { ...emptyGeo(), theatreCategories: ['Mainstream', 'Premium'] } }, 40)
  ];

  const media: Media[] = [];
  const m = (id: string, brandId: string, name: string, fileType: Media['fileType'], secs: number, attrs: Media['attributes'], status: Media['status'], ago: number, by: string, languages: string[], extra: Partial<Media> = {}) =>
    media.push({
      id, companyId: brandId.startsWith('BR-NW') ? 'CO-NWD' : 'CO-MER', brandId, name, fileType, durationSecs: secs, languages,
      fileName: name.replace(/\s+/g, '_') + (fileType === 'CPL' ? '_FTR-1_F_EN-XX_51_2K_20260801_SMPTE_OV' : fileType === 'Video' ? '.mp4' : '.png'),
      sizeBytes: fileType === 'CPL' ? secs * 78e6 : fileType === 'Video' ? secs * 7e6 : 5e6,
      censorCertificate: fileType === 'CPL' ? { fileName: 'cbfc-certificate.pdf', number: `CBFC/MUM/${1000 + ago * 7}/2026`, rating: 'U' } : null,
      attributes: attrs, orientation: fileType === 'CPL' ? null : (extra.orientation ?? 'Horizontal'),
      status, rejectionReason: null, createdAt: at(-ago, 11), createdBy: by, ...extra
    });
  m('MD-1', 'BR-TAN', 'Rivaah Festive 30s', 'CPL', 30, ['2D', '4K', 'Scope', 'Atmos'], 'ready', 30, 'Neha Bhatt', ['Hindi', 'English']);
  m('MD-2', 'BR-TAN', 'Rivaah Teaser 20s', 'CPL', 20, ['2D', '2K', 'Flat', '5.1'], 'ready', 30, 'Neha Bhatt', ['Hindi']);
  m('MD-3', 'BR-RE', 'Himalayan 460 Launch 40s', 'CPL', 40, ['2D', '4K', 'Full Container', '7.1'], 'processing', 1, 'Kavya Pillai', ['Hindi', 'English']);
  m('MD-4', 'BR-AMUL', 'Amul Dark Diwali 45s', 'CPL', 45, ['2D', '2K', 'Scope', '5.1'], 'ready', 20, 'Neha Bhatt', ['Hindi', 'Marathi']);
  m('MD-5', 'BR-K811', 'Kotak 811 Lobby Still', 'Image', 0, [], 'ready', 40, 'Aditi Rao', ['English']);
  m('MD-6', 'BR-TAN', 'Rivaah Vertical Cut 15s', 'Video', 15, [], 'ready', 5, 'Kavya Pillai', ['Hindi'], { orientation: 'Vertical' });
  m('MD-7', 'BR-TAN', 'Rivaah South 30s', 'CPL', 30, ['2D', '4K', 'Scope', 'Atmos'], 'ready', 10, 'Neha Bhatt', ['Telugu', 'Tamil']);
  m('MD-8', 'BR-RE', 'Himalayan Teaser 20s', 'CPL', 20, ['2D', '2K', 'Flat', '5.1'], 'rejected', 16, 'Kavya Pillai', ['Hindi'], { rejectionReason: 'Incorrect censor certificate' });
  m('MD-9', 'BR-AMUL', 'Amul Dark Lobby Loop', 'Video', 20, [], 'ready', 22, 'Aditi Rao', ['Hindi']);
  m('MD-10', 'BR-TAN', 'Rivaah Festive 60s Master', 'CPL', 60, ['2D', '4K', 'Scope', 'Atmos'], 'ready', 31, 'Neha Bhatt', ['Hindi', 'English']);
  m('MD-11', 'BR-NWA', 'Northwind Air Summer 30s', 'CPL', 30, ['2D', '2K', 'Flat', '5.1'], 'ready', 60, 'Vikram Desai', ['Hindi', 'English']);

  const db: Db = {
    exhibitors, sacs, theatres, doohGroups, devices, companies, brands, users, targetGroups, media,
    campaigns: [], placements: [], delivery: [], invoices: [], audit: [], seq: 5000
  };

  // ---- campaigns, built through the same rules the API uses so the numbers agree.
  const T = today();
  const camp = (id: string, code: string, companyId: string, brandId: string, name: string, start: number, end: number, budget: number,
    status: Campaign['status'], tgs: string[], mediaIds: string[], channels: Campaign['channels'] = ['cinema']): Campaign => {
    const company = companies.find(c => c.id === companyId)!;
    const c: Campaign = {
      id, code, companyId, sacId: company.sacId, brandId, name, type: 'Private', channels, start: d(start), end: d(end), budget,
      targetGroupIds: tgs, mediaIds, status, billingType: status === 'draft' ? null : company.billingType, payment: null, review: null,
      createdAt: at(start - 12), createdBy: companyId === 'CO-MER' ? 'Aditi Rao' : 'Vikram Desai', submittedAt: status === 'draft' ? null : at(start - 8)
    };
    db.campaigns.push(c);
    return c;
  };
  let pl = 4800;
  const place = (c: Campaign, mediaId: string, tgId: string, from: number, to: number, position: PlacementPosition, override?: Placement['status']) => {
    const tgObj = targetGroups.find(t => t.id === tgId)!;
    const company = companies.find(x => x.id === c.companyId)!;
    const sac = sacs.find(s => s.id === company.sacId)!;
    const reach = resolveReach(tgObj, theatres.filter(t => sac.exhibitorIds.includes(t.exhibitorId)), doohGroups);
    const q = quotePlacement({ screens: reach.units, from: d(from), to: d(to), position });
    const p: Placement = {
      id: `PL-${++pl}`, code: `PL-${pl}`, campaignId: c.id, mediaId, targetGroupId: tgId, from: d(from), to: d(to), timeBand: 'All day',
      position, screens: reach.units, plannedPlays: q.plays, cost: q.cost, createdAt: c.createdAt,
      status: override ?? (c.status === 'draft' || c.status === 'pending_approval' || c.status === 'rejected' ? 'draft' : statusOnApproval({ from: d(from), to: d(to) }, T))
    };
    db.placements.push(p);
    return p;
  };
  const cinema = (pack: 'Pre-show' | 'Intermission', segment: number, spot: CinemaSpot): PlacementPosition =>
    ({ channel: 'cinema', pack, segment, spot, unavailableAction: 'next-available' });
  const pay = (c: Campaign) => {
    const net = db.placements.filter(p => p.campaignId === c.id).reduce((s, p) => s + p.cost, 0);
    const { gst, total } = withGst(net);
    c.payment = { method: 'card', amount: total, gst, gatewayRef: `pay_${c.code.replace(/-/g, '')}`, paidAt: c.submittedAt!, refundedAt: null };
    if (c.status !== 'pending_approval') c.review = { by: 'Rohan Mehta', at: new Date(Date.parse(c.submittedAt!) + DAY).toISOString(), note: null };
  };

  const c1 = camp('CMP-2419', 'CMP-2026-0184', 'CO-MER', 'BR-TAN', 'Tanishq Rivaah — Festive Q3', -24, 24, 4_850_000, 'active', ['TG-1', 'TG-2', 'TG-3', 'TG-4'], ['MD-1', 'MD-2']);
  place(c1, 'MD-1', 'TG-1', -24, 24, cinema('Pre-show', 2, 'Spot D'));
  place(c1, 'MD-1', 'TG-2', -24, 24, cinema('Pre-show', 3, 'Spot A'));
  place(c1, 'MD-2', 'TG-3', -16, 24, cinema('Intermission', 1, 'Spot B'), 'paused');
  place(c1, 'MD-1', 'TG-4', 6, 24, cinema('Pre-show', 1, 'Spot C'));
  place(c1, 'MD-2', 'TG-1', -60, -30, cinema('Intermission', 2, 'Spot A'), 'completed');
  place(c1, 'MD-2', 'TG-2', 9, 30, cinema('Pre-show', 3, 'Spot E'));
  pay(c1);

  const c2 = camp('CMP-2402', 'CMP-2026-0171', 'CO-MER', 'BR-RE', 'Royal Enfield Himalayan 460', 6, 54, 3_120_000, 'scheduled', ['TG-4', 'TG-1'], ['MD-10']);
  place(c2, 'MD-10', 'TG-4', 6, 54, cinema('Pre-show', 1, 'Spot A'));
  place(c2, 'MD-10', 'TG-1', 10, 40, cinema('Intermission', 1, 'Spot C'));
  pay(c2);

  const c3 = camp('CMP-2388', 'CMP-2026-0162', 'CO-MER', 'BR-AMUL', 'Amul Dark — Diwali burst', -18, 7, 1_800_000, 'paused', ['TG-2', 'TG-5'], ['MD-4', 'MD-9'], ['cinema', 'dooh']);
  place(c3, 'MD-4', 'TG-2', -18, 7, cinema('Pre-show', 2, 'Spot B'), 'paused');
  place(c3, 'MD-9', 'TG-5', -18, 7, { channel: 'dooh', spotsPerHour: 4 }, 'paused');
  pay(c3);

  const c4 = camp('CMP-2350', 'CMP-2026-0120', 'CO-MER', 'BR-K811', 'Kotak 811 — Monsoon savings', -120, -60, 2_400_000, 'completed', ['TG-1', 'TG-5'], ['MD-1', 'MD-5'], ['cinema', 'dooh']);
  place(c4, 'MD-1', 'TG-1', -120, -60, cinema('Pre-show', 2, 'Spot A'));
  place(c4, 'MD-5', 'TG-5', -120, -60, { channel: 'dooh', spotsPerHour: 6 });
  pay(c4);

  const c5 = camp('CMP-2431', 'CMP-2026-0185', 'CO-MER', 'BR-TAN', 'Tanishq Rivaah — South cut', 20, 50, 900_000, 'draft', ['TG-3'], ['MD-7']);
  place(c5, 'MD-7', 'TG-3', 20, 50, cinema('Pre-show', 2, 'Spot B'));

  const c6 = camp('CMP-2436', 'CMP-2026-0187', 'CO-MER', 'BR-AMUL', 'Amul Dark — Winter lobby', 12, 40, 650_000, 'pending_approval', ['TG-5'], ['MD-9'], ['dooh']);
  place(c6, 'MD-9', 'TG-5', 12, 40, { channel: 'dooh', spotsPerHour: 6 });
  pay(c6);

  const c7 = camp('CMP-2440', 'CMP-2026-0190', 'CO-NWD', 'BR-NWA', 'Northwind Air — Summer pre-book', 15, 75, 9_500_000, 'pending_approval', ['TG-6'], ['MD-11']);
  place(c7, 'MD-11', 'TG-6', 15, 75, cinema('Pre-show', 1, 'Spot B'));

  const c8 = camp('CMP-2398', 'CMP-2026-0166', 'CO-NWD', 'BR-NWA', 'Northwind Air — Festive', -30, 10, 7_200_000, 'active', ['TG-6'], ['MD-11']);
  place(c8, 'MD-11', 'TG-6', -30, 10, cinema('Pre-show', 2, 'Spot C'));
  c8.review = { by: 'Rohan Mehta', at: at(-33), note: null };

  // Budgets sit a little above what's booked, rounded to the lakh.
  for (const c of db.campaigns) {
    const booked = db.placements.filter(p => p.campaignId === c.id).reduce((a, p) => a + p.cost, 0);
    c.budget = Math.max(c.budget, Math.ceil((booked * 1.15) / 100_000) * 100_000);
  }

  // ---- delivery: daily play-log roll-ups per theatre for everything that has run.
  const r = rng(7);
  for (const p of db.placements) {
    if (!['active', 'paused', 'completed'].includes(p.status)) continue;
    const tgObj = targetGroups.find(t => t.id === p.targetGroupId)!;
    const company = companies.find(c => c.id === db.campaigns.find(c => c.id === p.campaignId)!.companyId)!;
    const sac = sacs.find(s => s.id === company.sacId)!;
    const reach = resolveReach(tgObj, theatres.filter(t => sac.exhibitorIds.includes(t.exhibitorId)), doohGroups);
    const until = p.status === 'paused' ? Math.min(Date.parse(p.to), Date.now() - 4 * DAY) : Math.min(Date.parse(p.to), Date.now() - DAY);
    for (let t = Date.parse(p.from); t <= until; t += DAY) {
      const date = new Date(t).toISOString().slice(0, 10);
      for (const th of reach.theatres) {
        const units = p.position.channel === 'cinema'
          ? reach.screens.filter(s => s.theatreId === th.id).length
          : reach.doohGroups.filter(g => g.theatreId === th.id).length;
        const planned = units * (p.position.channel === 'cinema' ? 3 : 14 * p.position.spotsPerHour);
        const poor = th.id === 'TH-111' && t > Date.now() - 3 * DAY;
        const failed = poor ? Math.round(planned * 0.6) : r() < 0.12 ? Math.ceil(planned * 0.1 * r()) : 0;
        db.delivery.push({ placementId: p.id, campaignId: p.campaignId, date, theatreId: th.id, screenId: null, doohGroupId: null, planned, played: planned - failed, failed });
      }
    }
  }

  // ---- invoices raised by the SAC for paid card campaigns.
  let inv = 310;
  for (const c of db.campaigns.filter(c => c.payment)) {
    db.invoices.push({
      id: `INV-${++inv}`, number: `PVRM/INV/26-27/${inv}`, sacId: c.sacId, companyId: c.companyId, campaignId: c.id,
      amount: c.payment!.amount, gst: c.payment!.gst, issuedAt: c.payment!.paidAt, status: 'paid'
    });
  }

  db.audit.push(
    { id: 'AU-1', at: at(-58), actorId: 'U-ROHAN', actorName: 'Rohan Mehta', portal: 'sac', action: 'kyc.approve', entity: 'company', entityId: 'CO-MER', detail: 'Approved KYC · billing type Card / Prepaid', impersonatedBy: null },
    { id: 'AU-2', at: at(-20), actorId: 'U-HARSHIT', actorName: 'Harshit Thakkar', portal: 'admin', action: 'gateway.update', entity: 'sac', entityId: 'SAC-PVRM', detail: 'Razorpay test keys rotated', impersonatedBy: null },
    { id: 'AU-3', at: at(-2), actorId: 'U-LAKSHMI', actorName: 'Lakshmi Narayanan', portal: 'advertiser', action: 'kyc.submit', entity: 'company', entityId: 'CO-SUN', detail: 'Submitted 4 KYC documents for review', impersonatedBy: null }
  );
  return db;
}
