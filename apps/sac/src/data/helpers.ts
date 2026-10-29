import { theatreDefs, currency, doohStates, doohCountries, type TheatreDef, type DoohTheatreConfig } from './mockData';

export function money(n: number, cur: string = currency): string {
  const sym = cur === 'INR' ? '₹' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '$';
  return sym + Math.round(n).toLocaleString('en-US');
}

export function secs(n: number): string {
  const m = Math.floor(n / 60), s = Math.round(n % 60);
  return m + ':' + (s < 10 ? '0' + s : String(s));
}

export function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface Screen {
  id: string;
  name: string;
  format: string;
  seats: number;
  showCount: number;
  cap: number;
  sold: number;
}

export interface Theatre extends TheatreDef {
  screens: Screen[];
}

// Deterministically expand the six theatre definitions into per-screen inventory,
// mirroring the `get theatres()` memoized getter in the original DCLogic component.
let _theatres: Theatre[] | null = null;

export function getTheatres(): Theatre[] {
  if (_theatres) return _theatres;
  _theatres = theatreDefs.map((t, i) => {
    const screens: Screen[] = [];
    for (let j = 0; j < t.n; j++) {
      const premium = j === 0;
      const cap = premium ? 900 : 720;
      const showCount = 4 + ((i + j) % 2);
      const sold = Math.min(cap, (((i * 7 + j * 13) % 9) + 3) * 60);
      screens.push({
        id: t.id + '-S' + (j + 1),
        name: 'Screen ' + (j + 1),
        format: premium ? 'IMAX' : (j % 3 === 0 ? 'Dolby Cinema' : 'Standard'),
        seats: premium ? 486 : 120 + ((i * 11 + j * 17) % 8) * 24,
        showCount,
        cap: cap * showCount,
        sold: sold * showCount
      });
    }
    return { ...t, screens };
  });
  return _theatres;
}

/** Resolves a `theatreDefs[].city` string ("New York, NY") into city/state/country. */
export function doohPlace(t: TheatreDef): { city: string; state: string; country: string } {
  const parts = t.city.split(',');
  const abbr = (parts[1] || '').trim();
  return { city: parts[0].trim(), state: doohStates[abbr] || abbr, country: doohCountries[abbr] || 'United States' };
}

export function doohGroupScreens(config: DoohTheatreConfig | undefined | null): number {
  return config ? config.groups.reduce((a, g) => a + Number(g.screens), 0) : 0;
}
