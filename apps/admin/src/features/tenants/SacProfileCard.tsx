import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { date, type Sac } from '@slate/domain';
import { Alert, Button, Card, ConfirmDialog, Input, KeyValue, toast } from '@slate/ui';
import { errorMessage } from '../../components/errors';

type Status = Sac['status'];

export function SacProfileCard({ sac, canEdit }: { sac: Sac; canEdit: boolean }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: sac.name, legalName: sac.legalName, slug: sac.slug, gstin: sac.gstin, supportEmail: sac.supportEmail });
  const [confirm, setConfirm] = useState<Status | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const done = (message: string) => { void qc.invalidateQueries({ queryKey: ['admin'] }); toast.add({ variant: 'positive', message }); };

  const save = useMutation({ mutationFn: () => adminApi.updateSac(sac.id, { ...f, name: f.name.trim(), slug: f.slug.trim().toLowerCase() }), onSuccess: () => done('Profile saved.') });
  const setStatus = useMutation({
    mutationFn: (status: Status) => adminApi.updateSac(sac.id, { status }),
    onSuccess: (_r, status) => { setConfirm(null); done(`${sac.name} is now ${status}.`); },
    onError: () => setConfirm(null)
  });
  const dirty = (Object.keys(f) as (keyof typeof f)[]).some(k => f[k] !== sac[k]);
  const valid = f.name.trim() !== '' && /^[a-z0-9-]+$/.test(f.slug.trim().toLowerCase());
  const others = (['active', 'onboarding', 'suspended'] as const).filter(s => s !== sac.status);

  return (
    <div className="sl-grid sl-grid--aside">
      <Card title="Profile" description={canEdit ? undefined : 'Read-only for your role.'}>
        <form className="sl-stack" onSubmit={e => { e.preventDefault(); if (valid && dirty && !save.isPending) save.mutate(); }}>
          {save.error && <Alert variant="negative" inline closable={false}>{errorMessage(save.error)}</Alert>}
          <Input label="SAC name" value={f.name} onChange={set('name')} isReadOnly={!canEdit} isRequired />
          <Input label="Legal name" value={f.legalName} onChange={set('legalName')} isReadOnly={!canEdit} />
          <Input label="Portal slug" value={f.slug} onChange={set('slug')} isReadOnly={!canEdit} isRequired
            isInvalid={!/^[a-z0-9-]*$/.test(f.slug)} errorMessage={!/^[a-z0-9-]*$/.test(f.slug) ? 'Use lowercase letters, numbers and dashes only.' : undefined} />
          <Input label="GSTIN" value={f.gstin} onChange={set('gstin')} isReadOnly={!canEdit} />
          <Input label="Support email" type="email" value={f.supportEmail} onChange={set('supportEmail')} isReadOnly={!canEdit} />
          {canEdit && <div><Button variant="primary" type="submit" isPending={save.isPending} isDisabled={!dirty || !valid}>Save profile</Button></div>}
        </form>
      </Card>
      <Card title="Status">
        <div className="sl-stack">
          <KeyValue items={[['Current status', sac.status], ['Created', date(sac.createdAt)]]} />
          {setStatus.error && <Alert variant="negative" inline closable={false}>{errorMessage(setStatus.error)}</Alert>}
          {canEdit && (
            <div className="sl-row">
              {others.map(s => (
                <Button key={s} variant={s === 'suspended' ? 'negative' : 'default'} isDisabled={setStatus.isPending}
                  onPress={() => (s === 'suspended' ? setConfirm(s) : setStatus.mutate(s))}>
                  {s === 'active' ? 'Mark active' : s === 'onboarding' ? 'Mark onboarding' : 'Suspend'}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>
      <ConfirmDialog open={confirm === 'suspended'} title={`Suspend ${sac.name}?`} tone="negative" confirmLabel="Suspend SAC" busy={setStatus.isPending}
        onConfirm={() => setStatus.mutate('suspended')} onCancel={() => setConfirm(null)}>
        Suspending blocks this SAC and its advertisers from using the platform until it is reactivated. This is recorded in the audit log.
      </ConfirmDialog>
    </div>
  );
}
