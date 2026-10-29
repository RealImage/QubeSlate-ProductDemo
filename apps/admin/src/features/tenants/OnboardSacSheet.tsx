import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { DEFAULT_SUPPORT_EMAIL, isEmail, normaliseSacHost, sacUrlError } from '@slate/domain';
import { Alert, Button, Input, Sheet, toast } from '@slate/ui';
import { errorMessage } from '../../components/errors';
import { useSacs } from '../../components/queries';

const EMPTY = { name: '', legalName: '', url: '', supportEmail: '', adminName: '', adminEmail: '' };

export function OnboardSacSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [f, setF] = useState(EMPTY);
  const sacs = useSacs();
  const set = <K extends keyof typeof EMPTY>(k: K) => (v: (typeof EMPTY)[K]) => setF(p => ({ ...p, [k]: v }));

  const m = useMutation({
    mutationFn: () => adminApi.createSac({
      ...f, name: f.name.trim(), url: normaliseSacHost(f.url), adminName: f.adminName.trim(), adminEmail: f.adminEmail.trim()
    }),
    onSuccess: sac => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message: `${sac.name} onboarded. An invite goes to ${f.adminEmail}.` });
      setF(EMPTY);
      onClose();
      nav(`/tenants/sacs/${sac.id}`);
    }
  });
  // Uniqueness is checked against the SACs loaded so far; the API re-checks on save.
  const urlError = f.url.trim() === '' ? null : sacUrlError(f.url, sacs.data ?? []);
  const emailBad = f.supportEmail.trim() !== '' && !isEmail(f.supportEmail);
  const valid = f.name.trim() !== '' && f.url.trim() !== '' && !urlError && !emailBad && f.adminName.trim() !== '' && isEmail(f.adminEmail);
  // Dismissing mid-request would let its success handler act on a reopened form.
  const close = () => { if (m.isPending) return; m.reset(); onClose(); };

  return (
    <Sheet isOpen={open} onOpenChange={o => !o && close()} size={480}>
      <Sheet.Header>Onboard SAC</Sheet.Header>
      <Sheet.Body>
        <form id="onboard-sac" className="sl-stack" onSubmit={e => { e.preventDefault(); if (valid && !m.isPending) m.mutate(); }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          <Input label="SAC name" value={f.name} onChange={set('name')} isRequired />
          <Input label="Legal name" value={f.legalName} onChange={set('legalName')} />
          <Input label="SAC URL" description="Host only, e.g. qcn.slate.com. Its first label identifies the SAC." value={f.url} onChange={set('url')} isRequired placeholder="qcn.slate.com"
            isInvalid={!!urlError} errorMessage={urlError ?? undefined} />
          <Input label="Support email" type="email" value={f.supportEmail} onChange={set('supportEmail')} placeholder={DEFAULT_SUPPORT_EMAIL}
            isInvalid={emailBad} errorMessage={emailBad ? 'Enter a valid email address.' : undefined} description={`Leave blank to use ${DEFAULT_SUPPORT_EMAIL}.`} />
          <Alert variant="primary" inline closable={false} title="Inventory comes from CinemaDB">
            Map screens to this SAC in CinemaDB, then use Sync theatres on the SAC’s Exhibitors tab.
          </Alert>
          <strong>First SAC admin</strong>
          <Input label="Admin name" value={f.adminName} onChange={set('adminName')} isRequired />
          <Input label="Admin email" type="email" value={f.adminEmail} onChange={set('adminEmail')} isRequired />
        </form>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="default" onPress={close} isDisabled={m.isPending}>Cancel</Button>
        <Button variant="primary" type="submit" form="onboard-sac" isPending={m.isPending} isDisabled={!valid}>Onboard SAC</Button>
      </Sheet.Footer>
    </Sheet>
  );
}
