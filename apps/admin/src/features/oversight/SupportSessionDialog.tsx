import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi, portalUrl } from '@slate/api';
import type { User } from '@slate/domain';
import { Alert, Button, Dialog, Input, toast } from '@slate/ui';
import { errorMessage } from '../../components/errors';

/** Asks for a reason, records the support session via the API, then opens the target portal as that user. */
export function SupportSessionDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const m = useMutation({
    mutationFn: async (target: User) => {
      // Open the tab inside the click gesture so popup blockers allow it, then point it at the portal once the audit event is written.
      const tab = window.open('', '_blank');
      if (tab) tab.opener = null;
      try {
        const res = await adminApi.impersonate(target.id, reason.trim());
        const url = `${portalUrl(res.portal)}/?impersonate=${encodeURIComponent(res.userId)}&by=${encodeURIComponent(res.impersonatorId)}`;
        if (tab) tab.location.href = url; else window.open(url, '_blank');
        return res;
      } catch (e) {
        tab?.close();
        throw e;
      }
    },
    onSuccess: (_r, target) => {
      toast.add({ variant: 'positive', message: `Support session started as ${target.name}.` });
      setReason('');
      onClose();
    }
  });
  const close = () => { m.reset(); setReason(''); onClose(); };
  const valid = reason.trim().length > 0;

  return (
    <Dialog isOpen={!!user} onOpenChange={o => !o && close()} width={480}>
      <Dialog.Header>Start support session</Dialog.Header>
      <Dialog.Body>
        {user && (
          <form id="support-session" className="sl-stack" onSubmit={e => { e.preventDefault(); if (valid && !m.isPending) m.mutate(user); }}>
            <p style={{ margin: 0 }}>
              You will act as <strong>{user.name}</strong> ({user.email}) in the {user.portal === 'sac' ? 'SAC' : 'advertiser'} portal.
              Everything you do is audited and marked as a support session.
            </p>
            {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
            <Input label="Reason" description="Required. Recorded in the audit log, e.g. ticket number and what you are investigating." value={reason} onChange={setReason} isRequired autoFocus />
          </form>
        )}
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={close}>Cancel</Button>
        <Button variant="primary" type="submit" form="support-session" isPending={m.isPending} isDisabled={!valid}>Start session</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
