import type { Company, DoohGroup, Screen, TargetGroup, Theatre } from './types';

/**
 * A SAC's sellable inventory: active theatres where it has screens or DOOH groups mapped,
 * each theatre narrowed to the screens mapped to that SAC.
 */
export function sacInventory(sacId: string, theatres: Theatre[], dooh: Pick<DoohGroup, 'theatreId' | 'sacId'>[]): Theatre[] {
  const withDooh = new Set(dooh.filter(g => g.sacId === sacId).map(g => g.theatreId));
  const out: Theatre[] = [];
  for (const t of theatres) {
    if (t.status !== 'active') continue;
    const screens = t.screens.filter(s => s.sacId === sacId);
    if (screens.length || withDooh.has(t.id)) out.push(screens.length === t.screens.length ? t : { ...t, screens });
  }
  return out;
}

/** Theatres an advertiser can book: its SAC's inventory, narrowed if the SAC restricted access. */
export function visibleTheatres(company: Pick<Company, 'inventoryAccess' | 'sacId'>, theatres: Theatre[], dooh: Pick<DoohGroup, 'theatreId' | 'sacId'>[]): Theatre[] {
  const sold = sacInventory(company.sacId, theatres, dooh);
  const access = company.inventoryAccess;
  if (access.mode === 'full') return sold;
  return sold.filter(t => access.exhibitorIds.includes(t.exhibitorId) || access.theatreIds.includes(t.id));
}

/** Exhibitors a SAC sells, derived from its screen and DOOH mapping. */
export function exhibitorsOf(sacId: string, theatres: Theatre[], dooh: Pick<DoohGroup, 'theatreId' | 'sacId'>[]): string[] {
  const doohTheatres = new Set(dooh.filter(g => g.sacId === sacId).map(g => g.theatreId));
  return [...new Set(theatres.filter(t => doohTheatres.has(t.id) || t.screens.some(s => s.sacId === sacId)).map(t => t.exhibitorId))].sort();
}

const matches = <T>(selected: T[], value: T) => selected.length === 0 || selected.includes(value);

export interface Reach {
  theatres: Theatre[];
  screens: Screen[];
  doohGroups: DoohGroup[];
  /** Units the placement is priced on: cinema screens, or DOOH display groups. */
  units: number;
  cities: number;
}

/**
 * Resolves a target group's geographic dimensions to concrete inventory.
 * Interest and advanced dimensions (genre, rating, language, movie, actor) narrow which
 * shows play the ad, not which screens are reachable, so they don't reduce reach here.
 */
export function resolveReach(tg: TargetGroup, theatres: Theatre[], dooh: DoohGroup[]): Reach {
  const g = tg.geo;
  const pickedTheatres = theatres.filter(t =>
    matches(g.countries, t.country) &&
    matches(g.states, t.state) &&
    matches(g.cities, t.city) &&
    matches(g.theatreCategories, t.category) &&
    (g.theatreIds.length === 0 || g.theatreIds.includes(t.id) || t.screens.some(s => g.screenIds.includes(s.id)))
  );
  const screens = pickedTheatres.flatMap(t =>
    t.screens.filter(s =>
      (g.screenIds.length === 0 || g.screenIds.includes(s.id) || g.theatreIds.includes(t.id)) &&
      matches(g.screenCategories, s.category) &&
      matches(g.formats, s.format)
    )
  );
  const theatreIds = new Set(pickedTheatres.map(t => t.id));
  const doohGroups = tg.channel === 'dooh'
    ? dooh.filter(d => theatreIds.has(d.theatreId) && matches(tg.doohTypes, d.type))
    : [];
  const reached = tg.channel === 'cinema' ? new Set(screens.map(s => s.theatreId)) : new Set(doohGroups.map(d => d.theatreId));
  const reachedTheatres = pickedTheatres.filter(t => reached.has(t.id));
  return {
    theatres: reachedTheatres,
    screens: tg.channel === 'cinema' ? screens : [],
    doohGroups,
    units: tg.channel === 'cinema' ? screens.length : doohGroups.length,
    cities: new Set(reachedTheatres.map(t => t.city)).size
  };
}

/** One-line description of a target group, e.g. "6 cities · Premium · IMAX, 4DX · Hindi". */
export function summarizeTargetGroup(tg: TargetGroup): string {
  const parts: string[] = [];
  const g = tg.geo;
  if (g.cities.length) parts.push(g.cities.length > 3 ? `${g.cities.length} cities` : g.cities.join(', '));
  else if (g.states.length) parts.push(g.states.join(', '));
  if (g.theatreIds.length || g.screenIds.length) parts.push(`${g.theatreIds.length || ''}${g.theatreIds.length ? ' cinemas' : ''}${g.screenIds.length ? ` ${g.screenIds.length} screens` : ''}`.trim());
  if (g.theatreCategories.length) parts.push(g.theatreCategories.join(', '));
  if (g.formats.length) parts.push(g.formats.join(', '));
  if (tg.channel === 'dooh') parts.push(tg.doohTypes.length ? tg.doohTypes.join(', ') : 'All display types');
  if (tg.interest.genres.length) parts.push(tg.interest.genres.join(', '));
  if (tg.interest.ratings.length) parts.push(tg.interest.ratings.join('/'));
  if (tg.interest.languages.length) parts.push(tg.interest.languages.join(', '));
  if (tg.advanced.movies.length) parts.push(tg.advanced.movies.join(', '));
  if (tg.advanced.actors.length) parts.push(tg.advanced.actors.join(', '));
  return parts.join(' · ') || 'Entire accessible network';
}

/** Validation for the SAC's DOOH display-group editor. */
export function validateDoohGroup(g: Pick<DoohGroup, 'id' | 'name' | 'screens' | 'loop' | 'loopSecs'>, siblings: Pick<DoohGroup, 'id' | 'name'>[]): string[] {
  const errors: string[] = [];
  const name = g.name.trim();
  if (!name) errors.push('Group Name is required.');
  else if (siblings.some(s => s.id !== g.id && s.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.push('Group Name must be unique within the theatre.');
  }
  if (!Number.isInteger(g.screens)) errors.push('Screen Count must be a whole number.');
  else if (g.screens < 1) errors.push('Screen Count must be at least 1.');
  if (g.loop === 'Scheduled' && (!g.loopSecs || g.loopSecs < 5)) errors.push('Loop Duration must be at least 5 seconds.');
  return errors;
}

export function crossesMidnight(open: string, close: string): boolean {
  return close < open;
}
