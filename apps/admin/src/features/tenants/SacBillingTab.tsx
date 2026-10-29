import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type SacRow } from '@slate/api';
import {
  BILLING_CURRENCIES, BILLING_FREQUENCIES, BILLING_METHODS, cleanTaxIds, num, taxIdsError,
  type BillingCurrency, type BillingFrequency, type BillingMethod, type SacBillingProfile
} from '@slate/domain';
import { Button, Card, DataTable, Input, KeyValue, Query, Select, Textarea, type Column } from '@slate/ui';
import { Dash, FormDialog, TaxIdList, TaxIdsEditor, useSectionSave } from './shared';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NONE = '';
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const labelOf = <T extends string>(list: { value: T; label: string }[], v: T | null) => list.find(x => x.value === v)?.label ?? null;

export function SacBillingTab({ sac, canEdit }: { sac: SacRow; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const b = sac.billing;
  return (
    <div className="sl-stack">
      <Card title="Billing information" description="How Qube bills this SAC."
        actions={canEdit ? <Button variant="default" size="small" aria-label="Edit billing information" onPress={() => setEditing(true)}>Edit</Button> : undefined}>
        <KeyValue items={[
          ['Billing company name', <Dash value={b.companyName} />],
          ['Billing address', <Dash value={b.address} />],
          ['Billing company tax IDs', <TaxIdList items={b.taxIds} />],
          ['Billing method', <Dash value={labelOf(BILLING_METHODS, b.method)} />],
          ['Billing date', <Dash value={b.billingDay === null ? null : `Day ${b.billingDay} of the month`} />],
          ['Billing frequency', <Dash value={labelOf(BILLING_FREQUENCIES, b.frequency)} />],
          ['Billing currency', <Dash value={b.currency} />]
        ]} />
      </Card>
      <ActiveScreensCard sac={sac} />
      {editing && <BillingDialog sac={sac} onClose={() => setEditing(false)} />}
    </div>
  );
}

type Row = { month: number; values: (number | null)[] };

function ActiveScreensCard({ sac }: { sac: SacRow }) {
  const q = useQuery({ queryKey: ['admin', 'sac-active-screens', sac.id], queryFn: () => adminApi.sacActiveScreens(sac.id) });
  return (
    <Card flush title="Active screens — last 36 months" description="Active screens mapped to this SAC at each month’s close. Read-only.">
      <Query q={q} rows={6}>
        {grid => {
          const columns: Column<Row>[] = [
            { key: 'month', header: 'Month', cell: r => MONTHS[r.month - 1] },
            ...grid.years.map((y, i): Column<Row> => ({ key: String(y), header: String(y), align: 'right', cell: r => (r.values[i] === null || r.values[i] === undefined ? '--' : num(r.values[i]!)) }))
          ];
          return <DataTable caption={`Active screens by month for ${sac.name}`} rows={grid.rows} columns={columns} rowKey={r => String(r.month)} pageSize={12} />;
        }}
      </Query>
    </Card>
  );
}

function OptionalSelect<T extends string | number>({ label, value, onChange, options }: {
  label: string; value: T | null; onChange: (v: T | null) => void; options: { value: T; label: string }[];
}) {
  return (
    <Select label={label} selectedKey={value === null ? NONE : String(value)}
      onSelectionChange={k => { const key = k == null ? NONE : String(k); onChange(key === NONE ? null : options.find(o => String(o.value) === key)!.value); }}>
      <Select.Option id={NONE} textValue="Not set">Not set</Select.Option>
      {options.map(o => <Select.Option key={String(o.value)} id={String(o.value)} textValue={o.label}>{o.label}</Select.Option>)}
    </Select>
  );
}

function BillingDialog({ sac, onClose }: { sac: SacRow; onClose: () => void }) {
  const [f, setF] = useState<SacBillingProfile>(() => structuredClone(sac.billing));
  const set = <K extends keyof SacBillingProfile>(k: K) => (v: SacBillingProfile[K]) => setF(p => ({ ...p, [k]: v }));
  const save = useSectionSave((v: SacBillingProfile) => adminApi.updateSacBilling(sac.id, v), 'Billing information saved.', onClose);
  const taxError = taxIdsError(f.taxIds);
  return (
    <FormDialog title="Edit billing information" onClose={onClose} pending={save.isPending} error={save.error} valid={!taxError}
      onSubmit={() => save.mutate({ ...f, companyName: f.companyName.trim(), address: f.address.trim(), taxIds: cleanTaxIds(f.taxIds) })}>
      <Input label="Billing company name" value={f.companyName} onChange={set('companyName')} />
      <Textarea label="Billing address" value={f.address} onChange={set('address')} rows={3} />
      <TaxIdsEditor label="Billing company tax IDs" value={f.taxIds} onChange={set('taxIds')} />
      {taxError && <span className="sl-small" style={{ color: 'var(--text-negative, #b3261e)' }} role="alert">{taxError}</span>}
      <div className="sl-grid sl-grid--2">
        <OptionalSelect<BillingMethod> label="Billing method" value={f.method} onChange={set('method')} options={BILLING_METHODS} />
        <OptionalSelect<number> label="Billing date" value={f.billingDay} onChange={set('billingDay')} options={DAYS.map(d => ({ value: d, label: `Day ${d}` }))} />
        <OptionalSelect<BillingFrequency> label="Billing frequency" value={f.frequency} onChange={set('frequency')} options={BILLING_FREQUENCIES} />
        <OptionalSelect<BillingCurrency> label="Billing currency" value={f.currency} onChange={set('currency')} options={BILLING_CURRENCIES.map(c => ({ value: c, label: c }))} />
      </div>
    </FormDialog>
  );
}
