import type { CampaignDetail } from '@slate/api';
import { Button, Card, Checklist, KeyValue, Progress } from '@slate/ui';
import { checkoutChecklist, flight, inr, inrShort, num, pct, withGst, type Media } from '@slate/domain';
import { useCompany } from '../../../components/org';
import { channelsLabel } from '../shared';
import type { WizardForm } from './CampaignWizard';

/** Right rail: running total vs budget, current selection and the "Before checkout" checklist. */
export function SummaryRail({ form, detail, brandName, media, onSaveDraft, saving }: {
  form: WizardForm;
  detail: CampaignDetail | undefined;
  brandName: string;
  media: Media[];
  onSaveDraft: () => void;
  saving: boolean;
}) {
  const company = useCompany().data;
  const net = detail?.bookedValue ?? 0;
  const { gst, total } = withGst(net);
  const ratio = form.budget ? net / form.budget : 0;
  // Before the draft exists there is no server checklist yet; derive it locally from the form.
  const checklist = detail?.checklist ?? checkoutChecklist({ campaign: form, media, placements: [], company });

  return (
    <div className="sl-stack adv-rail">
      <Card title="Running total">
        <div className="sl-stack" style={{ gap: 8 }}>
          <div className="adv-total">{inr(net)}</div>
          <span className="sl-muted sl-small">
            {net === 0 ? `No placements yet · budget ${form.budget ? inrShort(form.budget) : 'not set'}` : `${pct(ratio)} of ${inrShort(form.budget)} budget · + ${inr(gst)} GST = ${inr(total)}`}
          </span>
          {form.budget > 0 && <Progress value={ratio} tone={ratio > 1 ? 'negative' : undefined} />}
        </div>
      </Card>
      <Card title="Selection">
        <KeyValue items={[
          ['Brand', brandName || '—'],
          ['Type', form.type],
          ['Flight', flight(form.start, form.end)],
          ['Channels', channelsLabel(form.channels)],
          ['Target groups', num(form.targetGroupIds.length)],
          ['Media', num(form.mediaIds.length)],
          ['Placements', num(detail?.placements.length ?? 0)],
          ['Screens reached', num(detail?.screens ?? 0)]
        ]} />
      </Card>
      <Card title="Before checkout">
        <Checklist items={checklist} />
      </Card>
      <Button variant="default" onPress={onSaveDraft} isPending={saving}>Save as draft</Button>
    </div>
  );
}
