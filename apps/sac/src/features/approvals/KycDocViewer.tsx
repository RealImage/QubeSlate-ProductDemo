import { useEffect, useMemo, useState } from 'react';
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

/** An object URL for the file, revoked when the file changes or the viewer closes. */
function useObjectUrl(f: KycFile | undefined) {
  const url = useMemo(() => (f ? URL.createObjectURL(toBlob(f)) : null), [f]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function save(f: KycFile) {
  const url = URL.createObjectURL(toBlob(f));
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
  const url = useObjectUrl(q.data);
  const [failed, setFailed] = useState(false);
  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={860}>
      <Dialog.Header>{doc.kind}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack" style={{ gap: 8 }}>
          <span className="sl-muted sl-small">{q.data?.fileName ?? doc.fileName}</span>
          {q.isLoading ? <Loading rows={6} />
            : q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
            : url && q.data?.mimeType === 'application/pdf' ? <iframe className="sl-docview" src={url} title={`${doc.kind} preview`} />
            : url ? (failed ? <FormError error={new Error('This image could not be shown. Download it to check.')} />
              : <div className="sl-docview sl-docview--image"><img src={url} alt={`${doc.kind} as uploaded`} onError={() => setFailed(true)} /></div>)
            : null}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Close</Button>
        <Button variant="primary" isDisabled={!q.data} onPress={() => q.data && save(q.data)}><DownloadIcon />Download</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
