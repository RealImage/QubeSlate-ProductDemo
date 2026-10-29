import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sacApi, useSession, type AdvertiserRow, type TheatreRow } from '@slate/api';
import { inr, inrShort, type BillingType, type InventoryAccess } from '@slate/domain';
import { Button, Card, ChoiceCards, DataTable, EmptyState, Input, KeyValue, Page, PageHeader, Query, Select, Sheet, StatusTag, toast } from '@slate/ui';
import { BILLING_LABEL, BillingTag, FormError, KycTag } from '../shared';
import { ContractFields, contractDraftError, contractFromDraft, draftFromContract, type ContractDraft } from './ContractFields';

function Toggle({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="sl-chip" aria-pressed={on} disabled={disabled} onClick={onClick} style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>{children}</button>;
}

function TermsForm({ a, theatres, canEdit, onClose }: { a: AdvertiserRow; theatres: TheatreRow[]; canEdit: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [billing, setBilling] = useState<BillingType>(a.billingType ?? 'card');
  const [contract, setContract] = useState<ContractDraft>(draftFromContract(a.contract));
  const [mode, setMode] = useState<'full' | 'restricted'>(a.inventoryAccess.mode);
  const [exhibitorIds, setExhibitorIds] = useState<string[]>(a.inventoryAccess.mode === 'restricted' ? a.inventoryAccess.exhibitorIds : []);
  const [theatreIds, setTheatreIds] = useState<string[]>(a.inventoryAccess.mode === 'restricted' ? a.inventoryAccess.theatreIds : []);
  const [showErrors, setShowErrors] = useState(false);

  const exhibitors = useMemo(() => {
    const m = new Map<string, { id: string; name: string; theatres: TheatreRow[] }>();
    for (const t of theatres) (m.get(t.exhibitorId) ?? m.set(t.exhibitorId, { id: t.exhibitorId, name: t.exhibitorName, theatres: [] }).get(t.exhibitorId)!).theatres.push(t);
    return [...m.values()];
  }, [theatres]);

  const save = useMutation({
    mutationFn: () => {
      const inventoryAccess: InventoryAccess = mode === 'full' ? { mode: 'full' } : { mode: 'restricted', exhibitorIds, theatreIds };
      return sacApi.setTerms(a.id, { billingType: billing, contract: billing === 'contracted' ? contractFromDraft(contract) : null, inventoryAccess });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sac'] });
      toast.add({ variant: 'positive', message: `Commercial terms updated for ${a.name}.` });
      onClose();
    }
  });

  const problem = (billing === 'contracted' ? contractDraftError(contract) : null)
    ?? (mode === 'restricted' && !exhibitorIds.length && !theatreIds.length ? 'Select at least one exhibitor or theatre, or choose full access.' : null);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  return (
    <>
      <Sheet.Body>
        <div className="sl-stack" style={{ gap: 20 }}>
          <KeyValue items={[
            ['Advertiser', `${a.name} (${a.code})`],
            ['KYC', <KycTag key="k" status={a.kycStatus} />],
            ['Active campaigns', a.activeCampaigns],
            ['Booked value', inr(a.bookedValue)],
            ['Outstanding', inr(a.outstanding)]
          ]} />
          <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="sl-stack">
            <div className="sl-stack" style={{ gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Billing type</h3>
              <ChoiceCards label="Billing type" value={billing} onChange={setBilling} options={[
                { value: 'card', title: 'Card / Prepaid', hint: 'Pays at checkout.', disabled: !canEdit },
                { value: 'contracted', title: 'Contracted', hint: 'Invoiced against a contract.', disabled: !canEdit }
              ]} />
            </div>
            {billing === 'contracted' && <ContractFields value={contract} onChange={setContract} showErrors={showErrors} />}
            <div className="sl-stack" style={{ gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Inventory access</h3>
              <ChoiceCards label="Inventory access" value={mode} onChange={setMode} options={[
                { value: 'full', title: 'Full access', hint: `All ${theatres.length} theatres you sell.`, disabled: !canEdit },
                { value: 'restricted', title: 'Restricted', hint: 'Only selected exhibitors or theatres.', disabled: !canEdit }
              ]} />
            </div>
            {mode === 'restricted' && (
              <div className="sl-stack" style={{ gap: 12 }}>
                {exhibitors.map(ex => {
                  const all = exhibitorIds.includes(ex.id);
                  return (
                    <div key={ex.id} className="sl-stack" style={{ gap: 6 }}>
                      <div className="sl-row"><strong style={{ fontSize: 13 }}>{ex.name}</strong><Toggle on={all} disabled={!canEdit} onClick={() => setExhibitorIds(toggle(exhibitorIds, ex.id))}>All theatres</Toggle></div>
                      <div className="sl-row" role="group" aria-label={`${ex.name} theatres`}>
                        {ex.theatres.map(t => <Toggle key={t.id} on={all || theatreIds.includes(t.id)} disabled={!canEdit || all} onClick={() => setTheatreIds(toggle(theatreIds, t.id))}>{t.name}</Toggle>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>
          {showErrors && problem && <FormError error={new Error(problem)} />}
          <FormError error={save.error} />
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="default" onPress={onClose} isDisabled={save.isPending}>{canEdit ? 'Cancel' : 'Close'}</Button>
        {canEdit && <Button variant="primary" isPending={save.isPending} onPress={() => (problem ? setShowErrors(true) : save.mutate())}>Save terms</Button>}
      </Sheet.Footer>
    </>
  );
}

function accessLabel(a: InventoryAccess) {
  return a.mode === 'full' ? 'Full' : `Restricted (${a.exhibitorIds.length} exhibitor${a.exhibitorIds.length === 1 ? '' : 's'}, ${a.theatreIds.length} theatre${a.theatreIds.length === 1 ? '' : 's'})`;
}

export function ClientDirectory() {
  const { can } = useSession();
  const q = useQuery({ queryKey: ['sac', 'advertisers'], queryFn: sacApi.advertisers });
  const theatres = useQuery({ queryKey: ['sac', 'theatres'], queryFn: sacApi.theatres });
  const [search, setSearch] = useState('');
  const [billing, setBilling] = useState<'all' | BillingType>('all');
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter(a => (billing === 'all' || a.billingType === billing) && (!s || `${a.name} ${a.code} ${a.gstin}`.toLowerCase().includes(s)));
  }, [q.data, search, billing]);
  const current = (q.data ?? []).find(a => a.id === open) ?? null;

  return (
    <Page>
      <PageHeader title="Clients" description="Advertisers on your portal, their commercial terms and exposure." />
      <div className="sl-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 420 }}><Input label="Search" placeholder="Name, code or GSTIN" value={search} onChange={setSearch} /></div>
        <div style={{ width: 220 }}>
          <Select label="Billing type" selectedKey={billing} onSelectionChange={k => setBilling(k as 'all' | BillingType)}>
            <Select.Option id="all">All</Select.Option>
            <Select.Option id="card">{BILLING_LABEL.card}</Select.Option>
            <Select.Option id="contracted">{BILLING_LABEL.contracted}</Select.Option>
          </Select>
        </div>
      </div>
      <Card flush>
        <Query q={q}>
          {() => (
            <DataTable
              rows={rows}
              rowKey={a => a.id}
              caption="Advertisers"
              onRowClick={a => setOpen(a.id)}
              empty={<EmptyState title="No advertisers match">{q.data?.length ? 'Try a different search or filter.' : 'No advertisers have signed up yet.'}</EmptyState>}
              columns={[
                { key: 'name', header: 'Advertiser', sort: a => a.name, cell: a => <><div className="sl-table__primary">{a.name}</div><div className="sl-table__secondary">{a.code}</div></> },
                { key: 'billing', header: 'Billing', sort: a => a.billingType ?? '', cell: a => <BillingTag type={a.billingType} /> },
                { key: 'kyc', header: 'KYC', sort: a => a.kycStatus, cell: a => <KycTag status={a.kycStatus} /> },
                { key: 'active', header: 'Active campaigns', align: 'right', sort: a => a.activeCampaigns, cell: a => a.activeCampaigns },
                { key: 'booked', header: 'Booked value', align: 'right', sort: a => a.bookedValue, cell: a => inrShort(a.bookedValue) },
                { key: 'outstanding', header: 'Outstanding / credit', align: 'right', sort: a => a.outstanding, cell: a => a.billingType === 'contracted' && a.contract ? `${inrShort(a.outstanding)} of ${inrShort(a.contract.creditLimit)}` : a.outstanding ? inrShort(a.outstanding) : '—' },
                { key: 'access', header: 'Inventory', cell: a => accessLabel(a.inventoryAccess) }
              ]}
            />
          )}
        </Query>
      </Card>
      <Sheet isOpen={!!current} onOpenChange={o => !o && setOpen(null)} size={560}>
        {current && (
          <>
            <Sheet.Header>Commercial terms</Sheet.Header>
            {current.kycStatus !== 'approved' ? (
              <>
                <Sheet.Body>
                  <p style={{ margin: 0 }}>{current.name} has KYC status <StatusTag tone="notice">{current.kycStatus}</StatusTag>. Commercial terms can be set once KYC is approved under Approvals ▸ Client.</p>
                </Sheet.Body>
                <Sheet.Footer><Button variant="default" onPress={() => setOpen(null)}>Close</Button></Sheet.Footer>
              </>
            ) : theatres.data
              // Cached inventory keeps the form mounted through a failed background refresh.
              ? <TermsForm key={current.id} a={current} theatres={theatres.data} canEdit={can('billing.classify')} onClose={() => setOpen(null)} />
              : theatres.isLoading ? <Sheet.Body><p className="sl-muted">Loading inventory…</p></Sheet.Body>
              : <Sheet.Body><FormError error={theatres.error ?? new Error('Could not load theatres.')} /></Sheet.Body>}
          </>
        )}
      </Sheet>
    </Page>
  );
}
