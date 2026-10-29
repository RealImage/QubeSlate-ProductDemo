import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { dateTime, type PaymentGatewayConfig, type Sac } from '@slate/domain';
import { Alert, Button, Card, Checkbox, ConfirmDialog, Input, Select, toast } from '@slate/ui';
import { KeyIcon } from 'prefab/icons';
import { errorMessage } from '../../components/errors';

type Provider = PaymentGatewayConfig['provider'];
type Mode = PaymentGatewayConfig['mode'];
const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'razorpay', label: 'Razorpay' }, { value: 'payu', label: 'PayU' }, { value: 'ccavenue', label: 'CCAvenue' }, { value: 'stub', label: 'Stub (no real payments)' }
];

export function SacGatewayCard({ sac, canEdit }: { sac: Sac; canEdit: boolean }) {
  const qc = useQueryClient();
  const g = sac.gateway;
  const [provider, setProvider] = useState<Provider>(g.provider);
  const [mode, setMode] = useState<Mode>(g.mode);
  const [merchantId, setMerchantId] = useState(g.merchantId);
  const [enabled, setEnabled] = useState(g.enabled);
  const [rotating, setRotating] = useState(!g.keyHint);
  const [secret, setSecret] = useState('');
  const [confirm, setConfirm] = useState(false);

  const m = useMutation({
    mutationFn: () => adminApi.updateGateway(sac.id, { provider, mode, merchantId: merchantId.trim(), secretKey: rotating && secret ? secret : null, enabled }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      toast.add({ variant: 'positive', message: 'Payment gateway saved.' });
      setSecret(''); setRotating(false); setConfirm(false);
    },
    onError: () => setConfirm(false)
  });

  const stubLive = enabled && provider === 'stub' && mode === 'live';
  const needsMerchant = enabled && provider !== 'stub' && !merchantId.trim();
  const needsKey = enabled && provider !== 'stub' && !g.keyHint && !secret;
  const changed = provider !== g.provider || mode !== g.mode || merchantId.trim() !== g.merchantId || enabled !== g.enabled || (rotating && secret !== '');
  const valid = !stubLive && !needsMerchant && !needsKey;
  const goingLive = mode === 'live' && (g.mode !== 'live' || enabled !== g.enabled || secret !== '' || provider !== g.provider);

  const submit = () => { if (!valid || !changed || m.isPending) return; if (mode === 'live') setConfirm(true); else m.mutate(); };

  return (
    <Card title="Payment gateway" description={`Used by this SAC’s Card and Prepaid advertisers. Last updated ${dateTime(g.updatedAt)}.`}>
      <form className="sl-stack" style={{ maxWidth: 520 }} onSubmit={e => { e.preventDefault(); submit(); }}>
        {!canEdit && <Alert variant="notice" inline closable={false}>Only Qube admins can change payment gateway settings.</Alert>}
        {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
        {!g.enabled && sac.status === 'active' && <Alert variant="notice" inline closable={false}>The gateway is disabled, so this SAC’s advertisers cannot pay by card.</Alert>}
        <Select label="Provider" selectedKey={provider} isDisabled={!canEdit} onSelectionChange={k => k != null && setProvider(String(k) as Provider)}>
          {PROVIDERS.map(p => <Select.Option key={p.value} id={p.value} textValue={p.label}>{p.label}</Select.Option>)}
        </Select>
        <Select label="Mode" selectedKey={mode} isDisabled={!canEdit} onSelectionChange={k => k != null && setMode(String(k) as Mode)}>
          <Select.Option id="test" textValue="Test">Test</Select.Option>
          <Select.Option id="live" textValue="Live">Live</Select.Option>
        </Select>
        {mode === 'live' && (
          <Alert variant="notice" title="Live mode" inline closable={false}>
            Live mode charges real money on real cards. Check the merchant ID and key belong to the SAC’s live account before saving.
          </Alert>
        )}
        <Input label="Merchant ID" value={merchantId} onChange={setMerchantId} isReadOnly={!canEdit} isInvalid={needsMerchant} errorMessage={needsMerchant ? 'Merchant ID is required to enable the gateway.' : undefined} />
        {rotating ? (
          <Input label="Secret key" type="password" autoComplete="off" value={secret} onChange={setSecret} isReadOnly={!canEdit} isInvalid={needsKey}
            errorMessage={needsKey ? 'A secret key is required to enable the gateway.' : undefined} description="Write-only. It is never shown again after saving."
            suffix={g.keyHint ? <span className="sl-small sl-muted">Keeps {g.keyHint} if empty</span> : undefined} />
        ) : (
          <div className="sl-row" style={{ justifyContent: 'space-between' }}>
            <div><div className="sl-small sl-muted">Secret key</div><span className="sl-mono">{g.keyHint}</span></div>
            {canEdit && <Button variant="default" size="small" onPress={() => setRotating(true)}><KeyIcon />Rotate key</Button>}
          </div>
        )}
        <Checkbox isSelected={enabled} onChange={setEnabled} isDisabled={!canEdit}>Gateway enabled</Checkbox>
        {stubLive && <Alert variant="negative" inline closable={false}>The stub gateway cannot run in live mode.</Alert>}
        {canEdit && <div><Button variant="primary" type="submit" isPending={m.isPending} isDisabled={!changed || !valid}>Save gateway</Button></div>}
      </form>
      <ConfirmDialog open={confirm} title="Save live gateway settings?" confirmLabel="Save live settings" tone="negative" busy={m.isPending}
        onConfirm={() => m.mutate()} onCancel={() => setConfirm(false)}>
        {goingLive ? 'This puts the gateway in live mode' : 'This updates a live gateway'}: {sac.name}’s advertisers will be charged real money
        {enabled ? '' : ', but the gateway is disabled so they cannot pay until it is enabled'}. The change is recorded in the audit log.
      </ConfirmDialog>
    </Card>
  );
}
