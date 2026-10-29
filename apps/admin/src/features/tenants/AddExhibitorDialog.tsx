import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { Alert, Button, Dialog, Input, toast } from '@slate/ui';
import { errorMessage } from '../../components/errors';

export function AddExhibitorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hq, setHq] = useState('');
  const m = useMutation({
    mutationFn: () => adminApi.createExhibitor({ name: name.trim(), code: code.trim().toUpperCase(), hq: hq.trim() }),
    onSuccess: e => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message: `${e.name} added.` });
      setName(''); setCode(''); setHq('');
      onClose();
    }
  });
  const valid = name.trim() !== '' && code.trim() !== '';
  const close = () => { m.reset(); onClose(); };

  return (
    <Dialog isOpen={open} onOpenChange={o => !o && close()} width={460}>
      <Dialog.Header>Add exhibitor</Dialog.Header>
      <Dialog.Body>
        <form id="add-exhibitor" className="sl-stack" onSubmit={e => { e.preventDefault(); if (valid && !m.isPending) m.mutate(); }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          <Input label="Name" value={name} onChange={setName} isRequired autoFocus />
          <Input label="Code" description="Short unique code, e.g. PVR" value={code} onChange={setCode} isRequired />
          <Input label="Headquarters" value={hq} onChange={setHq} optional />
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={close}>Cancel</Button>
        <Button variant="primary" type="submit" form="add-exhibitor" isPending={m.isPending} isDisabled={!valid}>Add exhibitor</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
