import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi } from '@slate/api';
import {
  Alert, Button, Card, Dialog, FileDropzone, Input, KeyValue, Page, PageHeader, Query, StatusTag, Textarea
} from '@slate/ui';
import { EditIcon, UploadIcon } from 'prefab/icons';
import { APPROVAL_TONE, KYC_FILE_TYPES, KYC_MAX_BYTES, date, type Company, type KycDoc } from '@slate/domain';
import { errorText, notifyError, notifySuccess, qk, useCompany, useOrg } from '../../components/org';
import { KYC_LABEL, kycAlert } from './KycBanner';
import { GSTIN, PAN } from './SignUp';

const DOC_TONE: Record<KycDoc['status'], 'secondary' | 'primary-secondary' | 'positive' | 'negative'> = {
  missing: 'secondary', uploaded: 'primary-secondary', verified: 'positive', rejected: 'negative'
};
const DOC_LABEL: Record<KycDoc['status'], string> = { missing: 'Missing', uploaded: 'Uploaded', verified: 'Verified', rejected: 'Rejected' };

export function CompanyPage() {
  const { sac } = useOrg();
  const q = useCompany();
  return (
    <Page>
      <PageHeader title="Company Information" description={`Registration, KYC and contacts. Approval is granted by ${sac.name}.`} />
      <Query q={q}>{company => <CompanyBody company={company} />}</Query>
    </Page>
  );
}

function CompanyBody({ company }: { company: Company }) {
  const { sac, can } = useOrg();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [uploadKind, setUploadKind] = useState<KycDoc['kind'] | null>(null);
  const brands = useQuery({ queryKey: qk.brands, queryFn: advertiserApi.brands });
  const alert = kycAlert(company, sac);
  const editable = can('company.edit');
  const canSubmit = editable && (company.kycStatus === 'draft' || company.kycStatus === 'rejected');
  const missing = company.kycDocs.filter(d => d.status === 'missing').length;

  const submit = useMutation({
    mutationFn: advertiserApi.submitKyc,
    onSuccess: c => { qc.setQueryData(qk.company, c); notifySuccess(`KYC submitted to ${sac.name} for review.`); },
    onError: notifyError
  });

  return (
    <>
      {alert && <Alert variant={alert.variant} title={alert.title} closable={false}>{alert.body}</Alert>}
      <div className="sl-grid sl-grid--aside">
        <div className="sl-stack">
          <Card title="Company details" actions={editable && <Button size="small" variant="default" onPress={() => setEditing(true)}><EditIcon width={16} height={16} />Edit</Button>}>
            <KeyValue items={[
              ['Registered name', company.name],
              ['Advertiser ID', company.code],
              ['Registered address', company.address || '—'],
              ['GST number', <span className="sl-mono">{company.gstin || '—'}</span>],
              ['PAN', <span className="sl-mono">{company.pan || '—'}</span>],
              ['Sales house', sac.name]
            ]} />
          </Card>

          <Card title="KYC documents" description={missing ? `${missing} of ${company.kycDocs.length} documents still to upload.` : 'All documents uploaded.'}
            actions={canSubmit && (
              <Button size="small" variant="primary" onPress={() => submit.mutate()} isPending={submit.isPending} isDisabled={missing > 0}>
                Submit for review
              </Button>
            )} flush>
            <div className="adv-list">
              {company.kycDocs.map(d => (
                <div key={d.kind} className="adv-list__item">
                  <div className="adv-list__main">
                    <span className="sl-table__primary">{d.kind}</span>
                    <span className="sl-table__secondary">
                      {d.fileName ? `${d.fileName} · uploaded ${date(d.uploadedAt)}` : 'Not uploaded'}
                      {d.note ? ` · ${d.note}` : ''}
                    </span>
                  </div>
                  <StatusTag tone={DOC_TONE[d.status]}>{DOC_LABEL[d.status]}</StatusTag>
                  {/* Verified documents stay locked while approved; during re-review any document can be replaced. */}
                  {editable && (d.status !== 'verified' || company.kycStatus !== 'approved') && (
                    <Button size="small" variant="default" onPress={() => setUploadKind(d.kind)} aria-label={`${d.fileName ? 'Replace' : 'Upload'} ${d.kind}`}>
                      {d.fileName ? 'Replace' : 'Upload'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Contacts" description="Who your sales house reaches for approvals, invoices and escalations." flush>
            <div className="adv-list">
              {company.contacts.length === 0 && <div className="adv-list__item sl-muted">No contacts yet.</div>}
              {company.contacts.map(c => (
                <div key={c.id} className="adv-list__item">
                  <div className="adv-list__main">
                    <span className="sl-table__primary">{c.name}</span>
                    <span className="sl-table__secondary">{c.email} · {c.phone}</span>
                  </div>
                  <StatusTag tone="secondary">{c.role}</StatusTag>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="sl-stack">
          <Card title="Approval status">
            <div className="sl-stack" style={{ gap: 8 }}>
              <div className="sl-row">
                <StatusTag tone={APPROVAL_TONE[company.kycStatus] ?? 'secondary'} size="medium">{KYC_LABEL[company.kycStatus]}</StatusTag>
                <span className="sl-muted sl-small">
                  {company.kycReviewedAt ? `Reviewed ${date(company.kycReviewedAt)}` : company.kycSubmittedAt ? `Submitted ${date(company.kycSubmittedAt)}` : 'Not yet submitted'}
                </span>
              </div>
              <p className="sl-muted sl-small" style={{ margin: 0 }}>Set by {sac.name}. Read-only here.</p>
            </div>
          </Card>
          <Card title="Approved brands">
            <div className="sl-stack" style={{ gap: 8 }}>
              <Query q={brands} rows={2}>
                {list => {
                  const ok = list.filter(b => b.status === 'approved');
                  return ok.length
                    ? <div className="sl-row">{ok.map(b => <StatusTag key={b.id} tone="primary-secondary">{b.name}</StatusTag>)}</div>
                    : <span className="sl-muted sl-small">No approved brands yet.</span>;
                }}
              </Query>
              <p className="sl-muted sl-small" style={{ margin: 0 }}>Brands you may advertise on behalf of. Approved by {sac.name} — <Link to="/company/brands">request a brand</Link>.</p>
            </div>
          </Card>
          <Card title="Billing profile">
            <div className="sl-stack" style={{ gap: 12 }}>
              <KeyValue items={[
                ['Billing type', company.billingType === 'card' ? 'Card / Prepaid' : company.billingType === 'contracted' ? 'Contracted' : 'Set on approval'],
                ['Billed by', sac.legalName],
                ...(company.contract ? [['Contract', company.contract.ref] as [string, string]] : [])
              ]} />
              <p className="sl-muted sl-small" style={{ margin: 0 }}>Set by {sac.name}. Read-only here.</p>
              {can('billing.view') && <Link to="/company/billing">Open Billing Details</Link>}
            </div>
          </Card>
        </div>
      </div>
      {editing && <EditCompanyDialog company={company} onClose={() => setEditing(false)} />}
      {uploadKind && <UploadKycDialog kind={uploadKind} onClose={() => setUploadKind(null)} />}
    </>
  );
}

function EditCompanyDialog({ company, onClose }: { company: Company; onClose: () => void }) {
  const { sac } = useOrg();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: company.name, address: company.address, gstin: company.gstin, pan: company.pan });
  const regChanged = f.gstin !== company.gstin || f.pan !== company.pan;
  const save = useMutation({
    mutationFn: () => advertiserApi.updateCompany({ name: f.name.trim(), address: f.address.trim(), gstin: f.gstin.trim(), pan: f.pan.trim() }),
    onSuccess: c => {
      qc.setQueryData(qk.company, c);
      // The org header and user list read the company from the session; refresh it so a rename shows everywhere.
      void qc.invalidateQueries({ queryKey: ['session'] });
      notifySuccess(regChanged && company.kycStatus === 'approved' ? `Saved. KYC re-submitted to ${sac.name} for review.` : 'Company details saved.');
      onClose();
    }
  });
  const nameError = !f.name.trim() ? 'Registered name is required.' : undefined;
  const gstinError = !GSTIN.test(f.gstin.trim()) ? 'Enter a valid 15-character GSTIN.' : undefined;
  const panError = !PAN.test(f.pan.trim()) ? 'Enter a valid 10-character PAN.' : undefined;
  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={560}>
      <Dialog.Header>Edit company details</Dialog.Header>
      <Dialog.Body>
        <div className="adv-form">
          <div className="adv-span"><Input label="Registered name" value={f.name} onChange={v => setF({ ...f, name: v })} errorMessage={nameError} /></div>
          <div className="adv-span"><Textarea label="Registered address" value={f.address} rows={2} onChange={v => setF({ ...f, address: v })} /></div>
          <Input label="GST number" value={f.gstin} onChange={v => setF({ ...f, gstin: v.toUpperCase() })} errorMessage={gstinError} />
          <Input label="PAN" value={f.pan} onChange={v => setF({ ...f, pan: v.toUpperCase() })} errorMessage={panError} />
          <div className="adv-span">
            <Alert variant="notice" closable={false} inline title={regChanged ? 'This change re-triggers KYC review' : undefined}>
              Changing the GST number or PAN sends your KYC back to {sac.name} for review. Checkout stays locked until it is re-approved.
            </Alert>
          </div>
          {save.error && <div className="adv-span"><Alert variant="negative" closable={false}>{errorText(save.error)}</Alert></div>}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" onPress={() => save.mutate()} isPending={save.isPending} isDisabled={!!(nameError || gstinError || panError)}>
          {regChanged && company.kycStatus === 'approved' ? 'Save and re-submit KYC' : 'Save'}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}

function UploadKycDialog({ kind, onClose }: { kind: KycDoc['kind']; onClose: () => void }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const fileError = !file ? null
    : !(KYC_FILE_TYPES as readonly string[]).includes(file.type) ? 'Upload a PDF, PNG or JPEG file.'
    : file.size > KYC_MAX_BYTES ? 'The file must be 5 MB or smaller.' : null;
  const upload = useMutation({
    // The reviewer previews exactly what was uploaded, so the content goes up with the name.
    mutationFn: async (f: File) => advertiserApi.uploadKycDoc(kind, f.name, await readDataUrl(f)),
    onSuccess: c => { qc.setQueryData(qk.company, c); notifySuccess(`${kind} uploaded.`); onClose(); }
  });
  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={480}>
      <Dialog.Header>Upload {kind}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack">
          <FileDropzone label={kind} acceptedTypes={['application/pdf', 'image/png', 'image/jpeg']} onFileSelect={files => setFile(files[0] ?? null)}
            description="PDF, PNG or JPEG · up to 5 MB">
            <FileDropzone.Icon><UploadIcon /></FileDropzone.Icon>
            <FileDropzone.Title>{file ? file.name : 'Drop the document here'}</FileDropzone.Title>
            <FileDropzone.Description>or click to browse</FileDropzone.Description>
          </FileDropzone>
          {fileError && <Alert variant="negative" closable={false}>{fileError}</Alert>}
          {upload.error && <Alert variant="negative" closable={false}>{errorText(upload.error)}</Alert>}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" onPress={() => file && upload.mutate(file)} isDisabled={!file || !!fileError} isPending={upload.isPending}>Upload</Button>
      </Dialog.Footer>
    </Dialog>
  );
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}
