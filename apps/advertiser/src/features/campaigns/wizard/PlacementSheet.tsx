import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type CampaignDetail, type PlacementInput, type TargetGroupWithReach } from '@slate/api';
import { Alert, Button, ChoiceCards, DateRangePicker, Input, KeyValue, Loading, Select, Sheet, StatusTag } from '@slate/ui';
import {
  CINEMA_SPOTS, inr, num, withGst, type CinemaPack, type CinemaSpot, type Media, type TimeBand
} from '@slate/domain';
import { errorText, notifySuccess, qk, useDebounced } from '../../../components/org';
import { Field } from '../../../components/controls';

const TIME_BANDS: TimeBand[] = ['All day', 'Morning', 'Afternoon', 'Evening', 'Night'];
const SEGMENTS: Record<CinemaPack, number> = { 'Pre-show': 4, Intermission: 2 };

/** "Add placement" drawer with a live quote from the server. */
export function PlacementSheet({ campaign, targetGroups, media, onClose }: {
  campaign: CampaignDetail;
  targetGroups: TargetGroupWithReach[];
  media: Media[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const tgs = targetGroups.filter(t => campaign.targetGroupIds.includes(t.id));
  const [tgId, setTgId] = useState(tgs[0]?.id ?? '');
  const tg = tgs.find(t => t.id === tgId);
  const channel = tg?.channel ?? 'cinema';
  // Cinema plays CPL; DOOH plays video or image.
  // TODO(orientation-eligibility): once product decides whether orientation gates eligibility, also filter DOOH media
  // here by the target group's display-group orientation (Horizontal / Vertical / Full Container).
  const eligibleMedia = media.filter(m => campaign.mediaIds.includes(m.id) && (channel === 'cinema' ? m.fileType === 'CPL' : m.fileType !== 'CPL'));
  const [mediaId, setMediaId] = useState(eligibleMedia[0]?.id ?? '');
  const [range, setRange] = useState({ start: campaign.start, end: campaign.end });
  const [timeBand, setTimeBand] = useState<TimeBand>('All day');
  const [pack, setPack] = useState<CinemaPack>('Pre-show');
  const [segment, setSegment] = useState(1);
  const [spot, setSpot] = useState<CinemaSpot>('Normal');
  const [unavailableAction, setUnavailable] = useState<'next-available' | 'skip'>('next-available');
  const [spotsPerHour, setSph] = useState('4');

  const mediaOk = eligibleMedia.some(m => m.id === mediaId);
  const sph = Number(spotsPerHour);
  const sphOk = Number.isInteger(sph) && sph >= 1 && sph <= 12;
  const input: PlacementInput | null = tg && mediaOk && range.start && range.end && (channel === 'cinema' || sphOk) ? {
    mediaId, targetGroupId: tg.id, from: range.start, to: range.end, timeBand,
    position: channel === 'cinema' ? { channel, pack, segment, spot, unavailableAction } : { channel, spotsPerHour: sph }
  } : null;

  const debounced = useDebounced(input, 300);
  const quote = useQuery({
    queryKey: ['quote', campaign.id, debounced],
    queryFn: () => advertiserApi.quotePlacement(campaign.id, debounced!),
    enabled: !!debounced,
    placeholderData: keepPreviousData
  });

  const add = useMutation({
    mutationFn: (b: PlacementInput) => advertiserApi.addPlacement(campaign.id, b),
    onSuccess: d => {
      qc.setQueryData(qk.campaign(campaign.id), d);
      qc.invalidateQueries({ queryKey: qk.campaigns });
      notifySuccess('Placement added.');
      onClose();
    }
  });

  const changeTg = (id: string) => {
    setTgId(id);
    const next = targetGroups.find(t => t.id === id);
    const fit = media.find(m => campaign.mediaIds.includes(m.id) && (next?.channel === 'dooh' ? m.fileType !== 'CPL' : m.fileType === 'CPL'));
    if (!eligibleMedia.some(m => m.id === mediaId) || next?.channel !== channel) setMediaId(fit?.id ?? '');
  };

  const q = quote.data;
  const unit = channel === 'cinema' ? 'Screens' : 'Display groups';
  return (
    <Sheet isOpen onOpenChange={o => !o && onClose()} size={520}>
      <Sheet.Header>Add placement</Sheet.Header>
      <Sheet.Body>
        <div className="sl-stack">
          <p className="sl-muted sl-small" style={{ margin: 0 }}>One media × one target group × dates × position.</p>
          <Select label="Target group" value={tgId || null} onChange={k => changeTg(String(k ?? ''))} description="Reusable — defined once under Target Groups.">
            {tgs.map(t => <Select.Option key={t.id} id={t.id} textValue={t.name}>{t.name} · {t.channel === 'cinema' ? 'Cinema' : 'DOOH'}</Select.Option>)}
          </Select>
          <Select label="Media" value={mediaId || null} onChange={k => setMediaId(String(k ?? ''))}
            errorMessage={tg && !eligibleMedia.length ? `Attach ${channel === 'cinema' ? 'CPL' : 'video or image'} media to the campaign first.` : undefined}
            description={channel === 'cinema' ? 'Cinema placements play CPL media.' : 'DOOH placements play video or image media.'}>
            {eligibleMedia.map(m => <Select.Option key={m.id} id={m.id}>{m.name}</Select.Option>)}
          </Select>
          <DateRangePicker label="Dates" value={range} onChange={r => r && setRange(r)} minValue={campaign.start} maxValue={campaign.end} locale="en-GB"
            description="Inside the campaign flight." />
          <Select label="Time band" value={timeBand} onChange={k => k && setTimeBand(k as TimeBand)}>
            {TIME_BANDS.map(b => <Select.Option key={b} id={b}>{b}</Select.Option>)}
          </Select>

          {channel === 'cinema' ? <>
            <Field label="Pack">
              <ChoiceCards label="Pack" value={pack} onChange={p => { setPack(p); setSegment(s => Math.min(s, SEGMENTS[p])); }} options={[
                { value: 'Pre-show', title: 'Pre-show', hint: 'Before the film starts.' },
                { value: 'Intermission', title: 'Intermission', hint: 'During the interval.' }
              ]} />
            </Field>
            <div className="adv-form">
              <Select label="Segment" value={String(segment)} onChange={k => k && setSegment(Number(k))}>
                {Array.from({ length: SEGMENTS[pack] }, (_, i) => String(i + 1)).map(s => <Select.Option key={s} id={s}>{`${pack} ${s}`}</Select.Option>)}
              </Select>
              <Select label="Spot" value={spot} onChange={k => k && setSpot(k as CinemaSpot)}>
                {CINEMA_SPOTS.map(s => <Select.Option key={s} id={s}>{s}</Select.Option>)}
              </Select>
            </div>
            <Select label="If the spot is not available" value={unavailableAction} onChange={k => k && setUnavailable(k as typeof unavailableAction)}
              description="Applies when the chosen spot is already sold or blocked for a show.">
              <Select.Option id="next-available">Play in the next available spot</Select.Option>
              <Select.Option id="skip">Do not play</Select.Option>
            </Select>
          </> : (
            <Input label="Spots per hour" type="number" inputMode="numeric" value={spotsPerHour} onChange={setSph}
              errorMessage={sphOk ? undefined : 'Between 1 and 12 spots per hour.'} description="Plays per display group per operating hour." />
          )}

          <div className="sl-card" style={{ padding: 16 }}>
            <div className="sl-stack" style={{ gap: 12 }} aria-live="polite">
              <strong style={{ fontSize: 13 }}>Estimated cost</strong>
              {!input ? <span className="sl-muted sl-small">Complete the fields above to see a quote.</span>
                : quote.isLoading ? <Loading rows={2} />
                : quote.error ? <Alert variant="negative" closable={false} inline>{errorText(quote.error)}</Alert>
                : q && (
                  <div style={{ opacity: quote.isPlaceholderData ? 0.6 : 1 }} className="sl-stack">
                    <div className="adv-metrics">
                      <div className="adv-metric"><strong>{num(q.units)}</strong><span>{unit}</span></div>
                      <div className="adv-metric"><strong>{num(q.theatres)}</strong><span>Cinemas</span></div>
                      <div className="adv-metric"><strong>{num(q.days)}</strong><span>Days</span></div>
                    </div>
                    <KeyValue items={[
                      ['Planned plays', num(q.plays)],
                      ['Rate per spot', <span>{inr(q.ratePerSpot)}{q.premium && <> <StatusTag tone="primary">Premium</StatusTag></>}</span>],
                      ['Placement (net)', inr(q.cost)],
                      ['GST @ 18%', inr(withGst(q.cost).gst)],
                      ['Placement total', <strong>{inr(withGst(q.cost).total)}</strong>]
                    ]} />
                    {q.units === 0 && <Alert variant="notice" closable={false} inline>This target group reaches no inventory you can book.</Alert>}
                  </div>
                )}
            </div>
          </div>
          {add.error && <Alert variant="negative" closable={false}>{errorText(add.error)}</Alert>}
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" isDisabled={!input || q?.units === 0} isPending={add.isPending} onPress={() => input && add.mutate(input)}>Add placement</Button>
      </Sheet.Footer>
    </Sheet>
  );
}
