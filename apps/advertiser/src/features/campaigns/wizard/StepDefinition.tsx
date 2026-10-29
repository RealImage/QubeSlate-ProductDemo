import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Checkbox, ChoiceCards, DateRangePicker, EmptyState, Input, Loading, Select } from '@slate/ui';
import { CAMPAIGN_TYPES, inr, suggestCampaignName, type Brand, type CampaignType, type Channel, type Company } from '@slate/domain';
import { Field } from '../../../components/controls';
import { todayIst } from '../../../components/org';
import { RequestBrandDialog } from '../../company/BrandsPage';
import type { WizardForm } from './CampaignWizard';

export function definitionErrors(f: WizardForm) {
  return {
    brand: !f.brandId ? 'Pick a brand.' : undefined,
    flight: !f.start || !f.end ? 'Pick the start and end dates.' : f.start > f.end ? 'End date must be on or after the start date.' : undefined,
    name: !f.name.trim() ? 'Give the campaign a name.' : undefined,
    channels: !f.channels.length ? 'Pick at least one channel.' : undefined,
    budget: !(f.budget > 0) ? 'Enter a budget.' : undefined
  };
}

/** Step 1: brand first, then campaign type, flight, name (suggested), channels and budget. */
export function StepDefinition({ form, update, brands, brandsLoading, showErrors, company }: {
  form: WizardForm;
  update: (p: Partial<WizardForm>) => void;
  brands: Brand[];
  brandsLoading: boolean;
  showErrors: boolean;
  company: Pick<Company, 'name'>;
}) {
  const [requesting, setRequesting] = useState(false);
  const e = definitionErrors(form);
  const err = (k: keyof typeof e) => (showErrors ? e[k] : undefined);
  const brand = brands.find(b => b.id === form.brandId);
  const suggestion = brand ? suggestCampaignName(brand.name, form.start, form.end) : '';
  const toggleChannel = (c: Channel, on: boolean) => update({ channels: on ? [...new Set([...form.channels, c])] : form.channels.filter(x => x !== c) });

  return (
    <Card title="Campaign information" description="Who the campaign is for and when it runs.">
      <div className="sl-stack">
        {brandsLoading ? <Loading rows={2} /> : brands.length === 0 ? (
          <EmptyState title="No approved brands yet" action={<Button variant="secondary" onPress={() => setRequesting(true)}>Request a brand</Button>}>
            Campaigns run for a brand your sales house has approved for {company.name}.
          </EmptyState>
        ) : (
          <div>
            <Select label="Brand" placeholder="Choose a brand" value={form.brandId || null} onChange={k => update({ brandId: k ? String(k) : '' })}
              errorMessage={err('brand')} description="Only brands approved for your company are listed.">
              {brands.map(b => <Select.Option key={b.id} id={b.id} textValue={b.name}>{b.name}{b.category ? ` · ${b.category}` : ''}</Select.Option>)}
            </Select>
            <p className="sl-small" style={{ margin: '4px 0 0' }}>
              Brand missing? <Button variant="link" size="small" onPress={() => setRequesting(true)}>Request a new brand</Button> or see <Link to="/company/brands">all brands</Link>.
            </p>
          </div>
        )}

        <Field label="Campaign type" hint="Sets which of your sales house’s rate cards applies.">
          <ChoiceCards label="Campaign type" value={form.type} onChange={(type: CampaignType) => update({ type })}
            options={CAMPAIGN_TYPES.map(t => ({ value: t.value, title: t.value, hint: t.hint }))} />
        </Field>

        <DateRangePicker label="Flight" value={form.start && form.end ? { start: form.start, end: form.end } : null}
          onChange={r => update({ start: r?.start ?? '', end: r?.end ?? '' })} minValue={todayIst()} locale="en-GB"
          errorMessage={err('flight')} description="Placements must fall inside these dates." />

        <Input label="Campaign name" value={form.name} onChange={v => update({ name: v, nameEdited: v.trim() !== '' })} errorMessage={err('name')}
          description={form.nameEdited && suggestion && form.name !== suggestion ? undefined : 'Suggested from the brand and flight — edit it if you like.'} />
        {form.nameEdited && suggestion && form.name !== suggestion && (
          <p className="sl-small" style={{ margin: '-8px 0 0' }}>
            <Button variant="link" size="small" onPress={() => update({ name: suggestion, nameEdited: false })}>Use “{suggestion}”</Button>
          </p>
        )}

        <Field label="Channels" error={err('channels')} hint="Cinema plays CPL media on screens; DOOH plays video or image media on lobby displays.">
          <div className="sl-row" style={{ gap: 16 }}>
            <Checkbox isSelected={form.channels.includes('cinema')} onChange={on => toggleChannel('cinema', on)}>Cinema</Checkbox>
            <Checkbox isSelected={form.channels.includes('dooh')} onChange={on => toggleChannel('dooh', on)}>DOOH</Checkbox>
          </div>
        </Field>

        <Input label="Campaign budget" prefix="₹" inputMode="numeric" value={form.budget ? form.budget.toLocaleString('en-IN') : ''}
          onChange={v => update({ budget: Number(v.replace(/\D/g, '')) || 0 })} errorMessage={err('budget')}
          description={form.budget ? `${inr(form.budget)} excl. GST. The running total warns when placements go over it.` : 'Excl. GST. The running total warns when placements go over it.'} />
      </div>
      {requesting && <RequestBrandDialog onClose={() => setRequesting(false)} />}
    </Card>
  );
}
