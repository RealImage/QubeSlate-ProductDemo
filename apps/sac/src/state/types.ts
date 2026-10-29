export interface FormFields {
  name: string;
  type: string;
  client: string;
  brand: string;
  start: string;
  end: string;
  onScreen: boolean;
  lobby: boolean;
  digitalWeb: boolean;
  digitalApp: boolean;
  mode: string;
  clientContactName: string;
  clientContactEmail: string;
  clientContactPhone: string;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  salesContactName: string;
  salesContactEmail: string;
  salesContactPhone: string;
  billingName: string;
  billingAddress: string;
  billingCycle: string;
  orderRegion: string;
  orderId: string;
  thirdPartyOrderId: string;
  advance: boolean;
  advanceAmount: string;
  pTG: string;
  pMedia: string;
  pPack: string;
  pPlays: number | string;
  invDate: string;
}

export interface Placement {
  id: string;
  tg: string;
  media: string;
  pack: string;
  plays: number;
}

export interface SettingsState {
  timezone: string;
  defaultPack: string;
  autoApprove: boolean;
  holdHours: string | number;
}

export interface DoohEditorState {
  id: string | null;
  type: string;
  name: string;
  screens: number | string;
  orientation: string;
  mode: string;
  loop: string;
  loopSecs: number | string;
  errors: string[];
}

export interface DoohDeleteState {
  id: string;
  name: string;
  screens: number;
}

export interface DoohFilterState {
  status: string;
  location: string;
  minScreens: string;
  maxScreens: string;
  minGroups: string;
  maxGroups: string;
  types: string[];
}

export interface AppState {
  // sidebar
  open: string[];
  collapsed: boolean;
  tempOpen: boolean;

  // campaign management
  campSearch: string;
  campStatus: string;

  // wizard
  step: number;
  f: FormFields;
  tgSel: string[];
  mediaSel: string[];
  placements: Placement[];
  published: boolean;

  // inventory availability
  invCircuit: string;
  invTheatre: string;
  screenSel: string[];

  // target groups list
  tgSearch: string;
  tgStatus: string;
  tgSort: string;
  tgDir: 'asc' | 'desc';

  // theatres directory
  thSearch: string;

  // compositions
  compFilter: string;

  // proof of play
  popCampaign: string;

  // pre-show playlist
  plShow: string;

  // playlist boundaries
  bPre: number;
  bInt: number;

  // rate bias overrides, keyed by rule id
  bias: Record<string, number>;

  // approval decisions, keyed by item id
  decisions: Record<string, string>;

  // retried distribution ids
  retried: string[];

  // platform settings
  settings: SettingsState;

  // network dooh
  doohSel: string | null;
  doohSearch: string;
  doohOpen: string[];
  doohHover: string | null;
  doohEditor: DoohEditorState | null;
  doohDelete: DoohDeleteState | null;
  doohDirty: boolean;
  doohSaved: boolean;
  doohData: Record<string, import('../data/mockData').DoohTheatreConfig> | null;
  doohPanel: boolean;
  doohSort: string;
  doohDir: 'asc' | 'desc';
  doohPage: number;
  doohFilter: DoohFilterState;
}

export const initialFormFields: FormFields = {
  name: 'Autumn Blockbuster Slate', type: 'Private', client: 'Northwind Motors Group',
  brand: 'Northwind Motors', start: '2026-09-07', end: '2026-10-04',
  onScreen: true, lobby: true, digitalWeb: false, digitalApp: false,
  mode: 'Fixed Commercial Terms',
  clientContactName: 'Aisha Karim', clientContactEmail: 'aisha.karim@northwindgroup.example', clientContactPhone: '+1 212 555 0142',
  billingContactName: 'Marcus Bell', billingContactEmail: 'ap@northwindgroup.example', billingContactPhone: '+1 212 555 0188',
  salesContactName: 'Priya Raman', salesContactEmail: 'priya.raman@qube.example', salesContactPhone: '+1 646 555 0119',
  billingName: 'Halcyon Media Group', billingAddress: '', billingCycle: 'Monthly',
  orderRegion: 'Northeast', orderId: 'PO-2026-4417', thirdPartyOrderId: 'HAL-RO-88214',
  advance: true, advanceAmount: '25% of booked value',
  pTG: 'tg-001', pMedia: 'm-1', pPack: 'Pre Show · A', pPlays: 42,
  invDate: '2026-09-07'
};

export const initialAppState: AppState = {
  open: ['Campaigns', 'Inventory', 'Reports'],
  collapsed: false,
  tempOpen: false,

  campSearch: '',
  campStatus: 'all',

  step: 1,
  f: initialFormFields,
  tgSel: ['tg-001', 'tg-002'],
  mediaSel: ['m-1', 'm-3'],
  placements: [
    { id: 'p1', tg: 'tg-001', media: 'm-1', pack: 'Pre Show · A', plays: 42 },
    { id: 'p2', tg: 'tg-002', media: 'm-3', pack: 'Intermission · B', plays: 28 }
  ],
  published: false,

  invCircuit: 'all',
  invTheatre: 'TH-101',
  screenSel: ['TH-101-S1', 'TH-101-S2'],

  tgSearch: '',
  tgStatus: 'all',
  tgSort: 'createdOn',
  tgDir: 'desc',

  thSearch: '',

  compFilter: 'all',

  popCampaign: 'all',

  plShow: 'TH-101-S1|19:45',

  bPre: 720,
  bInt: 240,

  bias: {},
  decisions: {},
  retried: [],

  settings: {
    timezone: 'America/New_York',
    defaultPack: 'Pre Show',
    autoApprove: false,
    holdHours: '24'
  },

  doohSel: null,
  doohSearch: '',
  doohOpen: ['Foyer'],
  doohHover: null,
  doohEditor: null,
  doohDelete: null,
  doohDirty: false,
  doohSaved: false,
  doohData: null,
  doohPanel: false,
  doohSort: 'updatedOn',
  doohDir: 'desc',
  doohPage: 1,
  doohFilter: { status: 'all', location: '', minScreens: '', maxScreens: '', minGroups: '', maxGroups: '', types: [] }
};
