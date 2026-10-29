import { useState, type ReactNode } from 'react';
import { Alert, Button, Dialog, Textarea, StatusTag } from '@slate/ui';
import type { BillingType, KycStatus } from '@slate/domain';
import { APPROVAL_TONE } from '@slate/domain';

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export const BILLING_LABEL: Record<BillingType, string> = { card: 'Card / Prepaid', contracted: 'Contracted' };

export function BillingTag({ type }: { type: BillingType | null }) {
  return type ? <StatusTag tone={type === 'contracted' ? 'primary-secondary' : 'default'}>{BILLING_LABEL[type]}</StatusTag> : <span className="sl-muted">Not classified</span>;
}

export function KycTag({ status }: { status: KycStatus }) {
  return <StatusTag tone={APPROVAL_TONE[status] ?? 'default'}>{status === 'draft' ? 'Not submitted' : status[0]!.toUpperCase() + status.slice(1)}</StatusTag>;
}

/** Inline API error banner shown inside dialogs and sheets. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return <Alert variant="negative" closable={false} inline role="alert">{errorText(error)}</Alert>;
}

function NoteForm({ title, description, label, confirmLabel, required, busy, error, tone, onConfirm, onCancel }: {
  title: string; description?: ReactNode; label: string; confirmLabel: string; required: boolean; busy: boolean; error: unknown;
  tone: 'primary' | 'negative'; onConfirm: (note: string) => void; onCancel: () => void;
}) {
  const [note, setNote] = useState('');
  return (
    <>
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack" style={{ gap: 12 }}>
          {description && <div className="sl-muted" style={{ fontSize: 13 }}>{description}</div>}
          <Textarea label={label} value={note} onChange={setNote} isRequired={required} optional={!required} rows={4} />
          <FormError error={error} />
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onCancel} isDisabled={busy}>Cancel</Button>
        <Button variant={tone} isPending={busy} isDisabled={required && !note.trim()} onPress={() => onConfirm(note.trim())}>{confirmLabel}</Button>
      </Dialog.Footer>
    </>
  );
}

/** Dialog that collects a note (mandatory for rejections) before confirming. Its state resets every time it opens. */
export function NoteDialog({ open, ...rest }: {
  open: boolean; title: string; description?: ReactNode; label?: string; confirmLabel: string; required?: boolean; busy: boolean; error: unknown;
  tone?: 'primary' | 'negative'; onConfirm: (note: string) => void; onCancel: () => void;
}) {
  const { label = 'Note', required = true, tone = 'negative', ...form } = rest;
  return (
    <Dialog isOpen={open} onOpenChange={o => !o && !form.busy && form.onCancel()} width={480}>
      <NoteForm {...form} label={label} required={required} tone={tone} />
    </Dialog>
  );
}
