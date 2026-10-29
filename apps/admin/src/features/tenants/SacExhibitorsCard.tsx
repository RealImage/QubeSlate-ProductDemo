import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import type { Sac } from '@slate/domain';
import { Alert, Button, Card, Checkbox, CheckboxGroup, Loading, toast } from '@slate/ui';
import { errorMessage } from '../../components/errors';
import { useExhibitors } from '../../components/queries';

export function SacExhibitorsCard({ sac, canEdit }: { sac: Sac; canEdit: boolean }) {
  const qc = useQueryClient();
  const ex = useExhibitors();
  const [ids, setIds] = useState(sac.exhibitorIds);
  const m = useMutation({
    mutationFn: () => adminApi.updateSac(sac.id, { exhibitorIds: ids }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin'] }); toast.add({ variant: 'positive', message: 'Linked exhibitors updated.' }); }
  });
  const dirty = ids.length !== sac.exhibitorIds.length || ids.some(i => !sac.exhibitorIds.includes(i));
  return (
    <Card title="Linked exhibitors" description="Inventory from these exhibitors is sold by this SAC.">
      {ex.isLoading ? <Loading rows={3} /> : ex.error ? <Alert variant="negative" inline closable={false}>{errorMessage(ex.error)}</Alert> : (
        <form className="sl-stack" onSubmit={e => { e.preventDefault(); if (dirty && ids.length && !m.isPending) m.mutate(); }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          {dirty && ids.length < sac.exhibitorIds.length && ids.length > 0 && (
            <Alert variant="notice" inline closable={false}>Unlinking an exhibitor removes its inventory from this SAC’s advertisers.</Alert>
          )}
          <CheckboxGroup aria-label="Linked exhibitors" value={ids} onChange={setIds} isDisabled={!canEdit} isInvalid={ids.length === 0} errorMessage={ids.length === 0 ? 'Select at least one exhibitor.' : undefined}>
            {(ex.data ?? []).map(e => <Checkbox key={e.id} value={e.id}>{e.name} <span className="sl-muted sl-small">· {e.theatres} theatres</span></Checkbox>)}
          </CheckboxGroup>
          {canEdit && <div><Button variant="primary" type="submit" isPending={m.isPending} isDisabled={!dirty || ids.length === 0}>Save exhibitors</Button></div>}
        </form>
      )}
    </Card>
  );
}
