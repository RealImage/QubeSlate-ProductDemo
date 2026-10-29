import type { Placement, PlacementStatus } from './types';

export type PlacementAction = 'pause' | 'resume' | 'cancel' | 'delete';

/**
 * Placement lifecycle (advertiser spec, module 5):
 *  - Pause: stop an active placement
 *  - Resume: restart a paused one
 *  - Cancel: stop one that hasn't started
 *  - Delete: remove one that hasn't started
 */
export function placementActions(p: Pick<Placement, 'status' | 'from'>, today: string): PlacementAction[] {
  const started = p.from <= today;
  switch (p.status) {
    case 'active':
      return ['pause'];
    case 'paused':
      return ['resume'];
    case 'scheduled':
      return started ? [] : ['cancel', 'delete'];
    case 'draft':
      return ['delete'];
    default:
      return [];
  }
}

export class TransitionError extends Error {}

/** Returns the next status, or null when the placement should be removed. */
export function applyPlacementAction(
  p: Pick<Placement, 'status' | 'from'>,
  action: PlacementAction,
  today: string
): PlacementStatus | null {
  if (!placementActions(p, today).includes(action)) {
    throw new TransitionError(`Cannot ${action} a ${p.status} placement${p.from <= today ? ' that has started' : ''}.`);
  }
  switch (action) {
    case 'pause':
      return 'paused';
    case 'resume':
      return 'active';
    case 'cancel':
      return 'cancelled';
    case 'delete':
      return null;
  }
}

/** When a campaign is approved its placements become scheduled or, if already inside their window, active. */
export function statusOnApproval(p: Pick<Placement, 'from' | 'to'>, today: string): PlacementStatus {
  if (p.to < today) return 'completed';
  return p.from <= today ? 'active' : 'scheduled';
}
