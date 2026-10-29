import type { PlacementPosition } from './types';

/** Rate-card constants. These belong to the SAC's rate card; fixed here until rate cards are modelled. */
export const RATE_CARD = {
  cinemaBasePerSpot: 640,
  cinemaSpotsPerScreenPerDay: 3,
  premiumMultiplier: 1.35,
  doohBasePerSpot: 45,
  doohOperatingHoursPerDay: 14,
  gstRate: 0.18
} as const;

export function daysInclusive(from: string, to: string): number {
  const ms = Date.parse(to) - Date.parse(from);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.round(ms / 86_400_000) + 1);
}

/** Spot A and Segment 1 are premium positions. */
export function isPremium(position: PlacementPosition): boolean {
  return position.channel === 'cinema' && (position.spot === 'Spot A' || position.segment === 1);
}

export interface PlacementQuote {
  days: number;
  plays: number;
  ratePerSpot: number;
  premium: boolean;
  cost: number;
}

export function quotePlacement(input: { screens: number; from: string; to: string; position: PlacementPosition }): PlacementQuote {
  const days = daysInclusive(input.from, input.to);
  if (input.position.channel === 'cinema') {
    const premium = isPremium(input.position);
    const plays = input.screens * days * RATE_CARD.cinemaSpotsPerScreenPerDay;
    const ratePerSpot = RATE_CARD.cinemaBasePerSpot * (premium ? RATE_CARD.premiumMultiplier : 1);
    return { days, plays, ratePerSpot, premium, cost: Math.round(plays * ratePerSpot) };
  }
  const plays = input.screens * days * RATE_CARD.doohOperatingHoursPerDay * input.position.spotsPerHour;
  return { days, plays, ratePerSpot: RATE_CARD.doohBasePerSpot, premium: false, cost: Math.round(plays * RATE_CARD.doohBasePerSpot) };
}

export function withGst(net: number): { net: number; gst: number; total: number } {
  const gst = Math.round(net * RATE_CARD.gstRate);
  return { net, gst, total: net + gst };
}
