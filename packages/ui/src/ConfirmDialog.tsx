import type { ReactNode } from 'react';
import { Button, Dialog } from 'prefab';

/** Controlled confirm dialog for destructive or irreversible actions. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', tone = 'primary', busy, onConfirm, onCancel }: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'negative';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog isOpen={open} onOpenChange={o => !o && onCancel()} role="alertdialog" width={440}>
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>{children}</Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onCancel}>Cancel</Button>
        <Button variant={tone} onPress={onConfirm} isPending={busy}>{confirmLabel}</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
