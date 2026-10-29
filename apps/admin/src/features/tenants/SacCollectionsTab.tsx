import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type GatewayInput, type SacCollectionsInput, type SacRow } from '@slate/api';
import { cleanTaxIds, date, gatewayError, isEmail, orDash, taxIdsError, type GatewayProvider, type PaymentGateway } from '@slate/domain';
import { Alert, Button, Card, Checkbox, ConfirmDialog, DataTable, EmptyState, Input, KeyValue, Menu, Select, StatusTag, toast, type Column } from '@slate/ui';
import { AddIcon, MoreVerticalIcon } from 'prefab/icons';
import { errorMessage } from '../../components/errors';
import { Dash, FormDialog, TaxIdList, TaxIdsEditor, useSectionSave } from './shared';

const PROVIDERS: { value: GatewayProvider; label: string }[] = [
  { value: 'razorpay', label: 'Razorpay' }, { value: 'payu', label: 'PayU' }, { value: 'ccavenue', label: 'CCAvenue' }, { value: 'stub', label: 'Stub (no real payments)' }
];
const providerLabel = (p: GatewayProvider) => PROVIDERS.find(x => x.value === p)?.label ?? p;

type Action = { kind: 'default' | 'enable' | 'disable' | 'delete'; gw: PaymentGateway };
type Form = { mode: 'add' } | { mode: 'edit'; gw: PaymentGateway } | null;

export function SacCollectionsTab({ sac, canEditCompany, canManageGateways }: { sac: SacRow; canEditCompany: boolean; canManageGateways: boolean }) {
  const [editingCompany, setEditingCompany] = useState(false);
  const [form, setForm] = useState<Form>(null);
  const c = sac.collections;
  return (
    <div className="sl-stack">
      <Card title="Company details" description="How this SAC collects from its advertisers."
        actions={canEditCompany ? <Button variant="default" size="small" aria-label="Edit company details" onPress={() => setEditingCompany(true)}>Edit</Button> : undefined}>
        <KeyValue items={[
          ['Company name', <Dash value={c.companyName} />],
          ['Location', <Dash value={c.location} />],
          ['Company phone', <Dash value={c.phone} />],
          ['Company email', <Dash value={c.email} />],
          ['Company tax IDs', <TaxIdList items={c.taxIds} />]
        ]} />
      </Card>
      <GatewaysCard sac={sac} canManage={canManageGateways} onAdd={() => setForm({ mode: 'add' })} onEdit={gw => setForm({ mode: 'edit', gw })} />
      {editingCompany && <CompanyDialog sac={sac} onClose={() => setEditingCompany(false)} />}
      {form && <GatewayDialog sac={sac} gw={form.mode === 'edit' ? form.gw : null} onClose={() => setForm(null)} />}
    </div>
  );
}

function CompanyDialog({ sac, onClose }: { sac: SacRow; onClose: () => void }) {
  const [f, setF] = useState<SacCollectionsInput>(() => structuredClone(sac.collections));
  const set = <K extends keyof SacCollectionsInput>(k: K) => (v: SacCollectionsInput[K]) => setF(p => ({ ...p, [k]: v }));
  const save = useSectionSave((v: SacCollectionsInput) => adminApi.updateSacCollections(sac.id, v), 'Company details saved.', onClose);
  const emailBad = f.email.trim() !== '' && !isEmail(f.email);
  const taxError = taxIdsError(f.taxIds);
  return (
    <FormDialog title="Edit company details" onClose={onClose} pending={save.isPending} error={save.error} valid={!emailBad && !taxError}
      onSubmit={() => save.mutate({ ...f, taxIds: cleanTaxIds(f.taxIds) })}>
      <Input label="Company name" value={f.companyName} onChange={set('companyName')} />
      <Input label="Location" value={f.location} onChange={set('location')} placeholder="City, country" />
      <div className="sl-grid sl-grid--2">
        <Input label="Company phone" type="tel" value={f.phone} onChange={set('phone')} />
        <Input label="Company email" type="email" value={f.email} onChange={set('email')} isInvalid={emailBad} errorMessage={emailBad ? 'Enter a valid email address.' : undefined} />
      </div>
      <TaxIdsEditor label="Company tax IDs" value={f.taxIds} onChange={set('taxIds')} />
      {taxError && <span className="sl-small" style={{ color: 'var(--text-negative, #b3261e)' }} role="alert">{taxError}</span>}
    </FormDialog>
  );
}

// ---------- gateways ----------

function GatewaysCard({ sac, canManage, onAdd, onEdit }: { sac: SacRow; canManage: boolean; onAdd: () => void; onEdit: (g: PaymentGateway) => void }) {
  const qc = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);
  const run = useMutation({
    mutationFn: ({ kind, gw }: Action) => {
      if (kind === 'default') return adminApi.setDefaultGateway(sac.id, gw.id);
      if (kind === 'delete') return adminApi.deleteGateway(sac.id, gw.id);
      return adminApi.setGatewayEnabled(sac.id, gw.id, kind === 'enable');
    },
    onSuccess: (_r, { kind }) => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message: { default: 'Default gateway changed.', enable: 'Gateway enabled.', disable: 'Gateway disabled.', delete: 'Gateway deleted.' }[kind] });
      setAction(null);
    }
  });
  const close = () => { if (run.isPending) return; run.reset(); setAction(null); };
  const pick = (kind: Action['kind'], gw: PaymentGateway) => { run.reset(); setAction({ kind, gw }); };

  const columns: Column<PaymentGateway>[] = [
    { key: 'provider', header: 'Provider', cell: g => <span className="sl-table__primary">{providerLabel(g.provider)}</span> },
    { key: 'merchant', header: 'Merchant ID', cell: g => <span className="sl-mono">{orDash(g.merchantId)}</span> },
    { key: 'key', header: 'Secret key', cell: g => <span className="sl-mono">{orDash(g.keyHint)}</span> },
    { key: 'mode', header: 'Mode', cell: g => <StatusTag tone={g.mode === 'live' ? 'positive' : 'primary-secondary'}>{g.mode === 'live' ? 'Live' : 'Test'}</StatusTag> },
    { key: 'status', header: 'Status', cell: g => <StatusTag tone={g.enabled ? 'positive' : 'secondary'}>{g.enabled ? 'Enabled' : 'Disabled'}</StatusTag> },
    { key: 'enabledOn', header: 'Enabled on', cell: g => (g.enabledOn ? date(g.enabledOn) : '--') },
    { key: 'activatedOn', header: 'Activated on', cell: g => (g.activatedOn ? date(g.activatedOn) : '--') },
    { key: 'default', header: 'Default', cell: g => (g.isDefault ? <StatusTag tone="primary-secondary">Default</StatusTag> : '') },
    ...(canManage ? [{
      key: 'actions', header: <span className="sl-sr-only">Actions</span>, width: 56, cell: (g: PaymentGateway) => (
        <Menu>
          <Menu.Trigger><Button variant="default" size="small" iconOnly aria-label={`Actions for ${providerLabel(g.provider)} ${g.merchantId}`}><MoreVerticalIcon /></Button></Menu.Trigger>
          <Menu.Items placement="bottom end" onAction={k => (k === 'edit' ? onEdit(g) : pick(String(k) as Action['kind'], g))}>
            <Menu.Item id="edit">Edit</Menu.Item>
            {!g.isDefault && <Menu.Item id="default">Set as default</Menu.Item>}
            <Menu.Item id={g.enabled ? 'disable' : 'enable'}>{g.enabled ? 'Disable' : 'Enable'}</Menu.Item>
            <Menu.Item id="delete">Delete</Menu.Item>
          </Menu.Items>
        </Menu>
      )
    } satisfies Column<PaymentGateway>] : [])
  ];

  const noDefault = sac.gateways.length > 0 && !sac.gateways.some(g => g.isDefault && g.enabled);
  const target = action?.gw;
  const copy: Record<Action['kind'], { title: string; label: string; body: string; tone: 'primary' | 'negative' }> = {
    default: { title: 'Set as default gateway?', label: 'Set as default', tone: 'primary', body: `Advertisers of ${sac.name} will pay through this gateway from now on.` },
    enable: { title: 'Enable gateway?', label: 'Enable', tone: target?.mode === 'live' ? 'negative' : 'primary',
      body: target?.mode === 'live' ? `This is a live gateway: ${sac.name}’s advertisers will be charged real money.` : 'This is a test gateway: no real money moves.' },
    disable: { title: 'Disable gateway?', label: 'Disable', tone: 'negative',
      body: target?.isDefault ? 'This is the default gateway. While it is disabled, advertisers cannot pay online until another gateway is made default and enabled.' : 'Advertisers will no longer be able to pay through it.' },
    delete: { title: 'Delete gateway?', label: 'Delete gateway', tone: 'negative',
      body: `${target ? providerLabel(target.provider) : 'This gateway'} and its stored key are removed.${target?.isDefault ? ' Another gateway becomes the default, if there is one.' : ''}` }
  };

  return (
    <Card flush title="Payment gateways" description={`Gateways ${sac.name} collects through. Advertisers pay through the default one.`}
      actions={canManage ? <Button variant="secondary" size="small" onPress={onAdd}><AddIcon />Add gateway</Button> : undefined}>
      {noDefault && sac.status === 'active' && (
        <div style={{ padding: '12px 16px' }}><Alert variant="notice" inline closable={false}>There is no enabled default gateway, so advertisers cannot pay online.</Alert></div>
      )}
      <DataTable caption={`Payment gateways of ${sac.name}`} rows={sac.gateways} columns={columns} rowKey={g => g.id}
        empty={<EmptyState title="No payment gateways yet">{canManage ? 'Add a gateway so advertisers can pay online.' : 'Only Qube admins can add gateways.'}</EmptyState>} />
      {action && (
        <ConfirmDialog open title={copy[action.kind].title} tone={copy[action.kind].tone} confirmLabel={copy[action.kind].label} busy={run.isPending}
          onConfirm={() => run.mutate(action)} onCancel={close}>
          <div className="sl-stack" style={{ gap: 12 }}>
            {run.error && <Alert variant="negative" inline closable={false}>{errorMessage(run.error)}</Alert>}
            <span>{copy[action.kind].body}</span>
          </div>
        </ConfirmDialog>
      )}
    </Card>
  );
}

function GatewayDialog({ sac, gw, onClose }: { sac: SacRow; gw: PaymentGateway | null; onClose: () => void }) {
  const [f, setF] = useState({ provider: gw?.provider ?? ('razorpay' as GatewayProvider), mode: gw?.mode ?? ('test' as PaymentGateway['mode']), merchantId: gw?.merchantId ?? '', enabled: gw?.enabled ?? false });
  const [secret, setSecret] = useState('');
  const save = useSectionSave(
    (v: GatewayInput) => (gw ? adminApi.updateGateway(sac.id, gw.id, v) : adminApi.addGateway(sac.id, v)),
    gw ? 'Gateway saved.' : 'Gateway added.', onClose
  );
  // Same rules the API enforces.
  const problem = gatewayError(f, gw, secret || null);

  return (
    <FormDialog title={gw ? 'Edit gateway' : 'Add gateway'} width={520} onClose={onClose} pending={save.isPending} error={save.error} valid={!problem} submitLabel={gw ? 'Save gateway' : 'Add gateway'}
      onSubmit={() => save.mutate({ ...f, merchantId: f.merchantId.trim(), secretKey: secret || null })}>
      <Select label="Provider" selectedKey={f.provider} onSelectionChange={k => k != null && setF(p => ({ ...p, provider: String(k) as GatewayProvider }))}>
        {PROVIDERS.map(p => <Select.Option key={p.value} id={p.value} textValue={p.label}>{p.label}</Select.Option>)}
      </Select>
      <Select label="Mode" selectedKey={f.mode} onSelectionChange={k => k != null && setF(p => ({ ...p, mode: String(k) as PaymentGateway['mode'] }))}>
        <Select.Option id="test" textValue="Test">Test</Select.Option>
        <Select.Option id="live" textValue="Live">Live</Select.Option>
      </Select>
      {f.mode === 'live' && (
        <Alert variant="notice" title="Live mode" inline closable={false}>Live mode charges real money on real cards. Check the merchant ID and key belong to the SAC’s live account.</Alert>
      )}
      <Input label="Merchant ID" value={f.merchantId} onChange={v => setF(p => ({ ...p, merchantId: v }))} />
      <Input label="Secret key" type="password" autoComplete="off" value={secret} onChange={setSecret}
        description={gw?.keyHint ? `Write-only. Leave blank to keep ${gw.keyHint}.` : 'Write-only. It is never shown again after saving.'} />
      <Checkbox isSelected={f.enabled} onChange={v => setF(p => ({ ...p, enabled: v }))}>Gateway enabled</Checkbox>
      {problem && <Alert variant="notice" inline closable={false}>{problem}</Alert>}
    </FormDialog>
  );
}
