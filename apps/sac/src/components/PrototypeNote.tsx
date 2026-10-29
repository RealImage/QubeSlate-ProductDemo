import { Alert } from '@slate/ui';

/** Banner for pages that still run on local mock data. */
export function PrototypeNote() {
  return <Alert variant="notice" closable={false} inline>Prototype data — not yet connected.</Alert>;
}
