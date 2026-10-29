import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type CampaignDetail, type CampaignInput } from '@slate/api';
import { Alert, Button, Card, EmptyState, Page, Query, Stepper } from '@slate/ui';
import { suggestCampaignName, type Brand, type Media } from '@slate/domain';
import { errorText, notifySuccess, qk, useOrg } from '../../../components/org';
import { ButtonLink } from '../../../components/controls';
import { StepDefinition, definitionErrors } from './StepDefinition';
import { StepTargets } from './StepTargets';
import { StepMedia } from './StepMedia';
import { StepPlacements } from './StepPlacements';
import { StepPayment } from './StepPayment';
import { SummaryRail } from './SummaryRail';

export interface WizardForm extends CampaignInput {
  /** False while the name is still the suggestion, so it follows brand and flight changes. */
  nameEdited: boolean;
}

const blank: WizardForm = {
  name: '', brandId: '', type: 'Private', channels: ['cinema'], start: '', end: '', budget: 0,
  targetGroupIds: [], mediaIds: [], nameEdited: false
};

/** /campaigns/new and /campaigns/:id/edit. Only drafts are editable; anything else goes to the detail page. */
export function CampaignWizard() {
  const { id } = useParams();
  const { can } = useOrg();
  const q = useQuery({ queryKey: qk.campaign(id ?? ''), queryFn: () => advertiserApi.campaign(id!), enabled: !!id });
  if (!can('campaign.edit')) {
    return <Page><Card><EmptyState title="You can’t edit campaigns" action={<Link to="/campaigns">Back to campaigns</Link>}>Your role is read-only. Ask a company admin or planner.</EmptyState></Card></Page>;
  }
  if (!id) return <Wizard />;
  return (
    <Query q={q} rows={8}>
      {c => (c.status !== 'draft' ? <Navigate to={`/campaigns/${c.id}`} replace /> : <Wizard key={c.id} initial={c} />)}
    </Query>
  );
}

function fromDetail(c: CampaignDetail, brandName: string): WizardForm {
  return {
    name: c.name, brandId: c.brandId, type: c.type, channels: c.channels, start: c.start, end: c.end, budget: c.budget,
    targetGroupIds: c.targetGroupIds, mediaIds: c.mediaIds,
    nameEdited: c.name !== suggestCampaignName(brandName, c.start, c.end)
  };
}

const mediaFits = (m: Pick<Media, 'fileType'>, channels: CampaignInput['channels']) =>
  m.fileType === 'CPL' ? channels.includes('cinema') : channels.includes('dooh');

function Wizard({ initial }: { initial?: CampaignDetail }) {
  const { company } = useOrg();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const brands = useQuery({ queryKey: qk.brands, queryFn: advertiserApi.brands });
  const tgs = useQuery({ queryKey: qk.targetGroups, queryFn: advertiserApi.targetGroups });
  const media = useQuery({ queryKey: qk.media, queryFn: advertiserApi.media });
  const campaignId = initial?.id ?? null;
  const detail = useQuery({ queryKey: qk.campaign(campaignId ?? ''), queryFn: () => advertiserApi.campaign(campaignId!), enabled: !!campaignId }).data ?? initial;

  const brandName = (id: string, list: Brand[] | undefined = brands.data) => list?.find(b => b.id === id)?.name ?? initial?.brandName ?? '';
  const [form, setForm] = useState<WizardForm>(() => (initial ? fromDetail(initial, initial.brandName) : blank));
  const [dirty, setDirty] = useState(false);
  // Bumped on every edit; a save only clears `dirty` if nothing changed while it was in flight.
  const revision = useRef(0);
  const [showErrors, setShowErrors] = useState(false);
  const step = Math.min(4, Math.max(0, Number(params.get('step') ?? 0) || 0));
  const setStep = (s: number) => setParams(s ? { step: String(s) } : {}, { replace: true });

  const update = (patch: Partial<WizardForm>) => {
    revision.current += 1;
    setDirty(true);
    setForm(f => {
      const next = { ...f, ...patch };
      if (!next.nameEdited && ('brandId' in patch || 'start' in patch || 'end' in patch)) {
        next.name = suggestCampaignName(brandName(next.brandId), next.start, next.end);
      }
      return next;
    });
  };

  /** What gets saved: drop attachments that no longer fit the selected channels or brand. */
  const toInput = (): CampaignInput => {
    const { nameEdited: _ignored, ...input } = form;
    const tgOk = (id: string) => { const t = tgs.data?.find(x => x.id === id); return !t || input.channels.includes(t.channel); };
    const mOk = (id: string) => { const m = media.data?.find(x => x.id === id); return !m || (m.brandId === input.brandId && mediaFits(m, input.channels)); };
    return { ...input, name: input.name.trim(), targetGroupIds: input.targetGroupIds.filter(tgOk), mediaIds: input.mediaIds.filter(mOk) };
  };

  const save = useMutation({
    mutationFn: (input: CampaignInput) => (campaignId ? advertiserApi.updateCampaign(campaignId, input) : advertiserApi.createCampaign(input)),
    onSuccess: d => {
      qc.setQueryData(qk.campaign(d.id), d);
      qc.invalidateQueries({ queryKey: qk.campaigns });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.targetGroups });
    }
  });

  const defErrors = definitionErrors(form);
  const defValid = Object.values(defErrors).every(e => !e);

  /** Persist pending edits (creating the draft on first leave of step 1), then move. Returns the saved id. */
  const persist = async (): Promise<string | null> => {
    if (!defValid) { setShowErrors(true); setStep(0); return null; }
    if (campaignId && !dirty) return campaignId;
    try {
      const started = revision.current;
      const d = await save.mutateAsync(toInput());
      if (revision.current === started) setDirty(false);
      return d.id;
    } catch {
      return null;
    }
  };

  const goTo = async (next: number) => {
    if (next === step) return;
    if (next > 0 || dirty) {
      const savedId = await persist();
      if (!savedId) return;
      if (!campaignId) { navigate(`/campaigns/${savedId}/edit?step=${next}`, { replace: true }); return; }
    }
    setStep(next);
  };

  const saveDraft = async () => {
    const savedId = await persist();
    if (savedId) {
      notifySuccess('Draft saved.');
      if (!campaignId) navigate(`/campaigns/${savedId}/edit?step=${step}`, { replace: true });
    }
  };

  /** Save, then leave the wizard (e.g. to create a target group or upload media). */
  const saveAndGo = async (to: string) => {
    const savedId = await persist();
    if (savedId) navigate(to);
  };

  const path = detail?.path ?? 'locked';
  const steps = [
    { title: 'Campaign information', hint: form.brandId ? brandName(form.brandId) || 'Brand, type, flight' : 'Brand, type, flight', done: defValid && !!campaignId },
    { title: 'Target groups', hint: `${form.targetGroupIds.length} attached`, done: form.targetGroupIds.length > 0, disabled: !defValid },
    { title: 'Media', hint: `${form.mediaIds.length} attached`, done: form.mediaIds.length > 0, disabled: !defValid },
    { title: 'Placements', hint: `${detail?.placements.length ?? 0} added`, done: (detail?.placements.length ?? 0) > 0, disabled: !defValid },
    { title: path === 'submit' ? 'Submit' : 'Payment', hint: path === 'submit' ? 'Contract approval' : path === 'locked' ? 'Locked until KYC' : 'Checkout', disabled: !defValid }
  ];

  const sharedLists = { brands: brands.data ?? [], targetGroups: tgs.data ?? [], media: media.data ?? [] };

  return (
    <>
      <div className="adv-wizard-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>{form.name.trim() || 'New campaign'}</h1>
          <span className="sl-muted sl-small">
            {[detail?.code ?? 'Draft — not saved yet', form.brandId && brandName(form.brandId), form.type].filter(Boolean).join(' · ')}
          </span>
        </div>
        <ButtonLink to="/campaigns" variant="default">Close</ButtonLink>
      </div>
      <Stepper steps={steps} current={step} onSelect={i => void goTo(i)} />
      <Page>
        <div className="sl-grid sl-grid--aside">
          <div className="sl-stack">
            {step === 0 && <StepDefinition form={form} update={update} brands={sharedLists.brands.filter(b => b.status === 'approved')}
              brandsLoading={brands.isLoading} showErrors={showErrors} company={company} />}
            {step === 1 && <StepTargets form={form} update={update} targetGroups={tgs} onCreateNew={() => void saveAndGo('/target-groups/new')} />}
            {step === 2 && <StepMedia form={form} update={update} media={media} brandName={brandName(form.brandId)} fits={m => mediaFits(m, form.channels)}
              onUploadNew={() => void saveAndGo('/media/new')} />}
            {step === 3 && detail && <StepPlacements campaign={detail} {...sharedLists} />}
            {step === 4 && detail && <StepPayment campaign={detail} />}
            {save.error && <Alert variant="negative" closable={false} title="Couldn’t save the campaign">{errorText(save.error)}</Alert>}
            <div className="adv-wizard-foot">
              <Button variant="default" onPress={() => (step === 0 ? navigate('/campaigns') : void goTo(step - 1))}>{step === 0 ? 'Cancel' : 'Back'}</Button>
              {step < 4 && <Button variant="primary" onPress={() => void goTo(step + 1)} isPending={save.isPending}>Continue</Button>}
            </div>
          </div>
          <SummaryRail form={form} detail={detail} brandName={brandName(form.brandId)} media={sharedLists.media}
            onSaveDraft={() => void saveDraft()} saving={save.isPending} />
        </div>
      </Page>
    </>
  );
}
