import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type SacRow } from '@slate/api';
import { Alert, Button, ConfirmDialog, Menu, toast } from '@slate/ui';
import { MoreVerticalIcon } from 'prefab/icons';
import { errorMessage } from '../../components/errors';

/**
 * The ⋯ menu for one SAC: optional View / Edit navigation plus whichever of Activate or Deactivate applies.
 * Deactivating asks first because the SAC's users and advertisers lose access. Renders nothing when it has no items.
 */
export function SacActionsMenu({ sac, canManage, onView, onEdit }: {
  sac: SacRow;
  canManage: boolean;
  onView?: () => void;
  onEdit?: () => void;
}) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const setStatus = useMutation({
    mutationFn: (status: SacRow['status']) => adminApi.setSacStatus(sac.id, { status }),
    onSuccess: (_r, status) => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message: `${sac.name} is now ${status}.` });
      setConfirm(false);
    },
    onError: e => { if (!confirm) toast.add({ variant: 'negative', message: errorMessage(e) }); }
  });

  const toggle = !canManage ? null : sac.status === 'active' ? 'deactivate' : 'activate';
  if (!onView && !onEdit && !toggle) return null;
  const close = () => { if (setStatus.isPending) return; setStatus.reset(); setConfirm(false); };

  return (
    <>
      <Menu>
        <Menu.Trigger><Button variant="default" size="small" iconOnly aria-label={`Actions for ${sac.name}`}><MoreVerticalIcon /></Button></Menu.Trigger>
        <Menu.Items placement="bottom end" onAction={k => {
          if (k === 'view') onView?.();
          else if (k === 'edit') onEdit?.();
          else if (k === 'activate') setStatus.mutate('active');
          else if (k === 'deactivate') { setStatus.reset(); setConfirm(true); }
        }}>
          {onView && <Menu.Item id="view">View SAC details</Menu.Item>}
          {onEdit && <Menu.Item id="edit">Edit SAC details</Menu.Item>}
          {toggle === 'activate' && <Menu.Item id="activate">Activate SAC</Menu.Item>}
          {toggle === 'deactivate' && <Menu.Item id="deactivate">Deactivate SAC</Menu.Item>}
        </Menu.Items>
      </Menu>
      <ConfirmDialog open={confirm} title={`Deactivate ${sac.name}?`} tone="negative" confirmLabel="Deactivate SAC" busy={setStatus.isPending}
        onConfirm={() => setStatus.mutate('inactive')} onCancel={close}>
        <div className="sl-stack" style={{ gap: 12 }}>
          {setStatus.error && <Alert variant="negative" inline closable={false}>{errorMessage(setStatus.error)}</Alert>}
          <span>This SAC’s users and all of its advertisers lose access until it is activated again. The change is recorded in the audit log.</span>
        </div>
      </ConfirmDialog>
    </>
  );
}
