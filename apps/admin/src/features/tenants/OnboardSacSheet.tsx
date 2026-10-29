import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { Alert, Button, Checkbox, CheckboxGroup, Input, Sheet, toast } from '@slate/ui';
import { errorMessage } from '../../components/errors';
import { useExhibitors } from '../../components/queries';

const EMPTY = { name: '', legalName: '', slug: '', gstin: '', supportEmail: '', exhibitorIds: [] as string[], adminName: '', adminEmail: '' };

export function OnboardSacSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const exhibitors = useExhibitors();
  const [f, setF] = useState(EMPTY);
  const set = <K extends keyof typeof EMPTY>(k: K) => (v: (typeof EMPTY)[K]) => setF(p => ({ ...p, [k]: v }));

  const m = useMutation({
    mutationFn: () => adminApi.createSac({
      ...f, name: f.name.trim(), slug: f.slug.trim().toLowerCase(), adminName: f.adminName.trim(), adminEmail: f.adminEmail.trim()
    }),
    onSuccess: sac => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message: `${sac.name} onboarded. An invite goes to ${f.adminEmail}.` });
      setF(EMPTY);
      onClose();
      nav(`/tenants/sacs/${sac.id}`);
    }
  });
  const slugOk = /^[a-z0-9-]*$/.test(f.slug.trim().toLowerCase());
  const valid = f.name.trim() !== '' && f.slug.trim() !== '' && slugOk && f.adminName.trim() !== '' && f.adminEmail.includes('@') && f.exhibitorIds.length > 0;
  const close = () => { m.reset(); onClose(); };

  return (
    <Sheet isOpen={open} onOpenChange={o => !o && close()} size={480}>
      <Sheet.Header>Onboard SAC</Sheet.Header>
      <Sheet.Body>
        <form id="onboard-sac" className="sl-stack" onSubmit={e => { e.preventDefault(); if (valid && !m.isPending) m.mutate(); }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          <Input label="SAC name" value={f.name} onChange={set('name')} isRequired />
          <Input label="Legal name" value={f.legalName} onChange={set('legalName')} />
          <Input label="Portal slug" description="Lowercase letters, numbers and dashes. Used for the SAC's portal address." value={f.slug} onChange={set('slug')} isRequired
            isInvalid={!slugOk} errorMessage={!slugOk ? 'Use lowercase letters, numbers and dashes only.' : undefined} />
          <Input label="GSTIN" value={f.gstin} onChange={set('gstin')} />
          <Input label="Support email" type="email" value={f.supportEmail} onChange={set('supportEmail')} />
          {exhibitors.error ? <Alert variant="negative" inline closable={false}>Couldn’t load exhibitors: {errorMessage(exhibitors.error)}</Alert> : (
            <CheckboxGroup label="Exhibitors sold" description="At least one." value={f.exhibitorIds} onChange={set('exhibitorIds')} isDisabled={exhibitors.isLoading}>
              {(exhibitors.data ?? []).map(e => <Checkbox key={e.id} value={e.id}>{e.name}</Checkbox>)}
            </CheckboxGroup>
          )}
          <strong>First SAC admin</strong>
          <Input label="Admin name" value={f.adminName} onChange={set('adminName')} isRequired />
          <Input label="Admin email" type="email" value={f.adminEmail} onChange={set('adminEmail')} isRequired />
        </form>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="default" onPress={close}>Cancel</Button>
        <Button variant="primary" type="submit" form="onboard-sac" isPending={m.isPending} isDisabled={!valid}>Onboard SAC</Button>
      </Sheet.Footer>
    </Sheet>
  );
}
