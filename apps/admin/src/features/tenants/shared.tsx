import { useId, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orDash, type TaxId } from '@slate/domain';
import { Alert, Button, Dialog, Input, toast } from '@slate/ui';
import { AddIcon, DeleteIcon } from 'prefab/icons';
import { errorMessage } from '../../components/errors';

/** Read-view value: blank shows `--`. */
export const Dash = ({ value }: { value: string | number | null | undefined }) => <>{orDash(value)}</>;

/** Name–value pairs, one per line; `--` when there are none. */
export function TaxIdList({ items }: { items: TaxId[] }) {
  if (!items.length) return <>--</>;
  return <span className="sl-stack" style={{ gap: 2 }}>{items.map((t, i) => <span key={i}>{t.name}: <span className="sl-mono">{t.value}</span></span>)}</span>;
}

/** Runs one section's save, refreshes admin data and confirms; the dialog closes only on success. */
export function useSectionSave<V>(mutationFn: (v: V) => Promise<unknown>, message: string, onDone: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message });
      onDone();
    }
  });
}

/**
 * Dialog around one section's form. Mount it only while open so its state (and any API error) resets on reopen.
 * It stays open when the save fails and cannot be dismissed while saving.
 */
export function FormDialog({ title, onClose, onSubmit, pending, error, valid = true, width = 560, submitLabel = 'Save', children }: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
  error: unknown;
  valid?: boolean;
  width?: number;
  submitLabel?: string;
  children: ReactNode;
}) {
  const formId = useId();
  return (
    <Dialog isOpen onOpenChange={o => { if (!o && !pending) onClose(); }} width={width}>
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>
        <form id={formId} className="sl-stack" noValidate onSubmit={e => { e.preventDefault(); if (valid && !pending) onSubmit(); }}>
          {error ? <Alert variant="negative" inline closable={false}>{errorMessage(error)}</Alert> : null}
          {children}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose} isDisabled={pending}>Cancel</Button>
        <Button variant="primary" type="submit" form={formId} isPending={pending} isDisabled={!valid}>{submitLabel}</Button>
      </Dialog.Footer>
    </Dialog>
  );
}

/** Editable list of name–value pairs (GSTIN / VAT / EIN…). */
export function TaxIdsEditor({ label, value, onChange }: { label: string; value: TaxId[]; onChange: (v: TaxId[]) => void }) {
  const set = (i: number, patch: Partial<TaxId>) => onChange(value.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  return (
    <fieldset className="sl-stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
      <legend style={{ fontWeight: 600, fontSize: 13, padding: 0, marginBottom: 4 }}>{label}</legend>
      {value.length === 0 && <span className="sl-muted sl-small">None added.</span>}
      {value.map((t, i) => (
        <div key={i} className="sl-row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
          <div style={{ flex: 1 }}><Input label="Name" value={t.name} onChange={v => set(i, { name: v })} placeholder="GSTIN" /></div>
          <div style={{ flex: 2 }}><Input label="Value" value={t.value} onChange={v => set(i, { value: v })} /></div>
          <Button variant="default" iconOnly aria-label={`Remove ${t.name || 'tax ID'} ${i + 1}`} onPress={() => onChange(value.filter((_, j) => j !== i))}><DeleteIcon /></Button>
        </div>
      ))}
      <div><Button variant="default" size="small" onPress={() => onChange([...value, { name: '', value: '' }])}><AddIcon />Add tax ID</Button></div>
    </fieldset>
  );
}
