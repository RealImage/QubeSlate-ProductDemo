export interface SettingsState {
  timezone: string;
  defaultPack: string;
  autoApprove: boolean;
  holdHours: string | number;
}

/** Local state for the pages that still run on mock data. */
export interface AppState {
  // inventory availability
  invCircuit: string;
  invTheatre: string;
  screenSel: string[];
  invDate: string;

  // compositions
  compFilter: string;

  // pre-show playlist
  plShow: string;

  // playlist boundaries
  bPre: number;
  bInt: number;

  // rate bias overrides, keyed by rule id
  bias: Record<string, number>;

  // retried distribution ids
  retried: string[];

  // platform settings
  settings: SettingsState;
}

export const initialAppState: AppState = {
  invCircuit: 'all',
  invTheatre: 'TH-101',
  screenSel: ['TH-101-S1', 'TH-101-S2'],
  invDate: '2026-09-07',
  compFilter: 'all',
  plShow: 'TH-101-S1|19:45',
  bPre: 720,
  bInt: 240,
  bias: {},
  retried: [],
  settings: { timezone: 'Asia/Kolkata', defaultPack: 'Pre Show', autoApprove: false, holdHours: '24' }
};
