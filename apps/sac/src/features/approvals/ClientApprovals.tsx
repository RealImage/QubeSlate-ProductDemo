import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sacApi, useSession, type AdvertiserRow } from '@slate/api';
import { dateTime } from '@slate/domain';
import { Button, Card, ChoiceCards, DataTable, EmptyState, KeyValue, Page, PageHeader, Query, Sheet, StatusTag, Textarea, toast } from '@slate/ui';
import type { BillingType, Contract } from '@slate/domain';
import { FormError } from '../shared';
import { KycDocActions } from './KycDocViewer';
import { ContractFields, emptyContractDraft, contractFromDraft, contractDraftError, type ContractDraft } from '../advertisers/ContractFields';

const DOC_TONE = { missing: 'negative', uploaded: 'notice', verified: 'positive', rejected: 'negative' } as const;

function ReviewForm({ a, canDecide, onClose }: { a: AdvertiserRow; canDecide: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  // Card / Prepaid unless the reviewer opts this advertiser into a contract.
  const [billing, setBilling] = useState<BillingType>('card');
  const [contract, setContract] = useState<ContractDraft>(emptyContractDraft());
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const decide = useMutation({
    mutationFn: (b: { decision: 'approve' | 'reject'; note: string | null; billingType: BillingType | null; contract: Contract | null }) => sacApi.decideKyc(a.id, b),
    onSuccess: (_, b) => {
      void qc.invalidateQueries({ queryKey: ['sac'] });
      toast.add({ variant: 'positive', message: `${a.name} ${b.decision === 'approve' ? 'approved' : 'rejected'}.` });
      onClose();
    }
  });

  const contractError = billing === 'contracted' ? contractDraftError(contract) : null;
  const approveError = contractError;
  const approve = () => {
    if (approveError) { setShowErrors(true); return; }
    decide.mutate({ decision: 'approve', note: note.trim() || null, billingType: billing, contract: billing === 'contracted' ? contractFromDraft(contract) : null });
  };
  const reject = () => decide.mutate({ decision: 'reject', note: note.trim(), billingType: null, contract: null });

  return (
    <>
      <Sheet.Body>
        <div className="sl-stack" style={{ gap: 20 }}>
          <section className="sl-stack" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Company</h3>
            <KeyValue items={[['Name', a.name], ['Advertiser code', a.code], ['GSTIN', a.gstin], ['PAN', a.pan], ['Address', a.address], ['Submitted', dateTime(a.kycSubmittedAt)]]} />
          </section>
          <section className="sl-stack" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Contacts</h3>
            {a.contacts.length ? <KeyValue items={a.contacts.map(c => [c.role, `${c.name} · ${c.email}${c.phone ? ` · ${c.phone}` : ''}`])} /> : <p className="sl-muted sl-small" style={{ margin: 0 }}>No contacts provided.</p>}
          </section>
          <section className="sl-stack" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>KYC documents</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {a.kycDocs.map(d => (
                <li key={d.kind} className="sl-row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  <span><strong style={{ fontWeight: 500 }}>{d.kind}</strong><br /><span className="sl-muted sl-small">{d.fileName ?? 'Not uploaded'}{d.uploadedAt ? ` · ${dateTime(d.uploadedAt)}` : ''}</span></span>
                  <span className="sl-row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                    <StatusTag tone={DOC_TONE[d.status]}>{d.status[0]!.toUpperCase() + d.status.slice(1)}</StatusTag>
                    {d.fileName && <KycDocActions advertiserId={a.id} doc={d} />}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {canDecide ? (
            <section className="sl-stack" style={{ gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Decision</h3>
              <div className="sl-stack" style={{ gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Billing type</span>
                <ChoiceCards label="Billing type" value={billing} onChange={setBilling} options={[
                  { value: 'card', title: 'Card / Prepaid', hint: 'Pays at checkout. Rejected campaigns are refunded.' },
                  { value: 'contracted', title: 'Contracted', hint: 'Invoiced against a contract and credit limit.' }
                ]} />
              </div>
              {billing === 'contracted' && <ContractFields value={contract} onChange={setContract} showErrors={showErrors} />}
              <Textarea label="Note to advertiser" description="Required when rejecting." value={note} onChange={setNote} rows={3} />
              {showErrors && approveError && <FormError error={new Error(approveError)} />}
              <FormError error={decide.error} />
            </section>
          ) : <p className="sl-muted sl-small" style={{ margin: 0 }}>Your role cannot decide KYC reviews.</p>}
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="default" onPress={onClose} isDisabled={decide.isPending}>Close</Button>
        {canDecide && (
          <>
            <Button variant="negative" isDisabled={!note.trim() || decide.isPending} onPress={reject}>Reject</Button>
            <Button variant="primary" isPending={decide.isPending} onPress={approve}>Approve</Button>
          </>
        )}
      </Sheet.Footer>
    </>
  );
}

export function ClientApprovals() {
  const { can } = useSession();
  const q = useQuery({ queryKey: ['sac', 'advertisers'], queryFn: sacApi.advertisers });
  const [open, setOpen] = useState<string | null>(null);
  const pending = (q.data ?? []).filter(a => a.kycStatus === 'pending');
  const current = pending.find(a => a.id === open) ?? null;

  return (
    <Page>
      <PageHeader title="Client Approvals" description="Review advertiser KYC, then classify each advertiser as Card / Prepaid or Contracted." actions={q.data && <StatusTag tone="notice" size="medium">{pending.length} awaiting review</StatusTag>} />
      <Card flush>
        <Query q={q}>
          {() => (
            <DataTable
              rows={pending}
              rowKey={a => a.id}
              caption="Advertisers pending KYC review"
              onRowClick={a => setOpen(a.id)}
              empty={<EmptyState title="No KYC reviews waiting">New advertiser sign-ups will appear here.</EmptyState>}
              columns={[
                { key: 'name', header: 'Advertiser', sort: a => a.name, cell: a => <><div className="sl-table__primary">{a.name}</div><div className="sl-table__secondary">{a.code}</div></> },
                { key: 'gstin', header: 'GSTIN', cell: a => <span className="sl-mono">{a.gstin}</span> },
                { key: 'docs', header: 'Documents', cell: a => `${a.kycDocs.filter(d => d.status !== 'missing').length} of ${a.kycDocs.length} uploaded` },
                { key: 'submitted', header: 'Submitted', sort: a => a.kycSubmittedAt ?? '', cell: a => dateTime(a.kycSubmittedAt) },
                { key: 'open', header: <span className="sr-only">Review</span>, align: 'right', cell: a => <Button size="small" variant="default" onPress={() => setOpen(a.id)}>Review</Button> }
              ]}
            />
          )}
        </Query>
      </Card>
      <Sheet isOpen={!!current} onOpenChange={o => !o && setOpen(null)} size={560}>
        {current && (
          <>
            <Sheet.Header>Review {current.name}</Sheet.Header>
            <ReviewForm key={current.id} a={current} canDecide={can('approvals.decide')} onClose={() => setOpen(null)} />
          </>
        )}
      </Sheet>
    </Page>
  );
}

