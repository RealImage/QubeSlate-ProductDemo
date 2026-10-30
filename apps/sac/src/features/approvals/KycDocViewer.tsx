import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sacApi } from '@slate/api';
import type { KycDoc, KycFile } from '@slate/domain';
import { Button, Dialog, ErrorState, Loading, toast } from '@slate/ui';
import { DownloadIcon, EyeIcon } from 'prefab/icons';
import { FormError } from '../shared';

/** Keyed by upload time too, so a re-uploaded document never shows the previous file. */
const fileQuery = (advertiserId: string, doc: KycDoc) => ({
  queryKey: ['sac', 'kyc-doc', advertiserId, doc.kind, doc.uploadedAt],
  queryFn: () => sacApi.kycDocFile(advertiserId, doc.kind),
  staleTime: 60_000
});

function toBlob(f: KycFile): Blob {
  const bin = atob(f.dataUrl.slice(f.dataUrl.indexOf(',') + 1));
  return new Blob([Uint8Array.from(bin, ch => ch.charCodeAt(0))], { type: f.mimeType });
}

/**
 * An object URL for the file, revoked when the file changes or the viewer closes. Created in the effect so every
 * setup (including StrictMode's replay) has its own URL to clean up. `failed` when the content cannot be decoded.
 */
function useObjectUrl(f: KycFile | undefined): { url: string | null; failed: boolean } {
  const [state, setState] = useState<{ url: string | null; failed: boolean }>({ url: null, failed: false });
  useEffect(() => {
    if (!f) return;
    let url: string;
    try { url = URL.createObjectURL(toBlob(f)); }
    catch { setState({ url: null, failed: true }); return; }
    setState({ url, failed: false });
    return () => URL.revokeObjectURL(url);
  }, [f]);
  return state;
}

function save(f: KycFile) {
  const url = URL.createObjectURL(toBlob(f)); // callers catch a decode failure
  const a = Object.assign(document.createElement('a'), { href: url, download: f.fileName });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Preview and Download for one uploaded KYC document, so the reviewer can check it is the right file. */
export function KycDocActions({ advertiserId, doc }: { advertiserId: string; doc: KycDoc }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try { save(await qc.fetchQuery(fileQuery(advertiserId, doc))); }
    catch (e) { toast.add({ variant: 'negative', message: e instanceof Error ? e.message : 'Could not download the file.' }); }
    finally { setBusy(false); }
  };
  return (
    <>
      <Button size="small" variant="default" iconOnly aria-label={`Preview ${doc.kind}`} onPress={() => setOpen(true)}><EyeIcon /></Button>
      <Button size="small" variant="default" iconOnly aria-label={`Download ${doc.kind}`} isPending={busy} onPress={() => void download()}><DownloadIcon /></Button>
      {open && <KycDocViewer advertiserId={advertiserId} doc={doc} onClose={() => setOpen(false)} />}
    </>
  );
}

function KycDocViewer({ advertiserId, doc, onClose }: { advertiserId: string; doc: KycDoc; onClose: () => void }) {
  const q = useQuery(fileQuery(advertiserId, doc));
  const { url, failed: unreadable } = useObjectUrl(q.data);
  const [failed, setFailed] = useState(false);
  const download = () => {
    if (!q.data) return;
    try { save(q.data); } catch { toast.add({ variant: 'negative', message: 'Could not download the file.' }); }
  };
  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={860}>
      <Dialog.Header>{doc.kind}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack" style={{ gap: 8 }}>
          <span className="sl-muted sl-small">{q.data?.fileName ?? doc.fileName}</span>
          {q.isLoading ? <Loading rows={6} />
            : q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
            : unreadable ? <FormError error={new Error('This file could not be read. Ask the advertiser to upload it again.')} />
            : url && q.data?.mimeType === 'application/pdf' ? <iframe className="sl-docview" src={url} title={`${doc.kind} preview`} />
            : url ? (failed ? <FormError error={new Error('This image could not be shown. Download it to check.')} />
              : <div className="sl-docview sl-docview--image"><img src={url} alt={`${doc.kind} as uploaded`} onError={() => setFailed(true)} /></div>)
            : null}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Close</Button>
        <Button variant="primary" isDisabled={!q.data || unreadable} onPress={download}><DownloadIcon />Download</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
