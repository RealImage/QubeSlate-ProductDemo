import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type TargetGroupInput, type TargetGroupWithReach } from '@slate/api';
import {
  Alert, Button, Card, ChipToggle, ChoiceCards, Input, Loading, Page, PageHeader, Query, Select, Tag
} from '@slate/ui';
import { DOOH_TYPES, num, type Channel, type Theatre } from '@slate/domain';
import { errorText, notifySuccess, qk, useDebounced, useOrg } from '../../components/org';
import { Field, IdChips, TagInput } from '../../components/controls';
import { GENRES, LANGUAGES, RATINGS, SCREEN_CATEGORIES, SCREEN_FORMATS, THEATRE_CATEGORIES, uniq } from './options';

const emptyInput = (channel: Channel = 'cinema'): TargetGroupInput => ({
  name: '', channel,
  geo: { countries: [], states: [], cities: [], theatreIds: [], screenIds: [], theatreCategories: [], screenCategories: [], formats: [] },
  interest: { genres: [], ratings: [], languages: [] },
  advanced: { movies: [], actors: [] },
  doohTypes: []
});

const toInput = (tg: TargetGroupWithReach): TargetGroupInput => ({
  name: tg.name, channel: tg.channel, geo: tg.geo, interest: tg.interest, advanced: tg.advanced, doohTypes: tg.doohTypes
});

/** Create (/target-groups/new) or edit (/target-groups/:id) a target group. */
export function TargetGroupBuilder() {
  const { id } = useParams();
  const existing = useQuery({ queryKey: qk.targetGroup(id ?? ''), queryFn: () => advertiserApi.targetGroup(id!), enabled: !!id });
  const theatres = useQuery({ queryKey: qk.theatres, queryFn: advertiserApi.theatres });
  return (
    <Page>
      <p className="sl-eyebrow"><Link to="/target-groups">Target Groups</Link> / {id ? existing.data?.name ?? id : 'New target group'}</p>
      <PageHeader title={id ? 'Edit target group' : 'Create target group'} />
      <Query q={theatres}>
        {list => id
          ? <Query q={existing}>{tg => <Builder key={tg.id} id={tg.id} initial={toInput(tg)} theatres={list} channelLocked={tg.usedBy > 0} />}</Query>
          : <Builder initial={emptyInput()} theatres={list} />}
      </Query>
    </Page>
  );
}

/** `channelLocked`: the group is used by campaigns, whose placements depend on its channel. */
function Builder({ id, initial, theatres, channelLocked }: { id?: string; initial: TargetGroupInput; theatres: Theatre[]; channelLocked?: boolean }) {
  const { can } = useOrg();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(initial);
  const [touched, setTouched] = useState(false);
  const editable = can('targets.edit');
  const geo = f.geo;
  const setGeo = (patch: Partial<TargetGroupInput['geo']>) => setF(x => ({ ...x, geo: reconcileGeo({ ...x.geo, ...patch }, theatres) }));

  // Each geographic level narrows the options below it.
  const opts = useMemo(() => {
    const inCountry = theatres.filter(t => !geo.countries.length || geo.countries.includes(t.country));
    const inState = inCountry.filter(t => !geo.states.length || geo.states.includes(t.state));
    const inCity = inState.filter(t => !geo.cities.length || geo.cities.includes(t.city));
    return {
      countries: uniq(theatres.map(t => t.country)),
      states: uniq(inCountry.map(t => t.state)),
      cities: uniq(inState.map(t => t.city)),
      theatres: inCity.map(t => ({ id: t.id, label: `${t.name} · ${t.city}` })),
      screens: inCity.flatMap(t => t.screens.map(s => ({ id: s.id, label: `${t.name} — ${s.name} (${s.format})` })))
    };
  }, [theatres, geo.countries, geo.states, geo.cities]);

  // Memoised on the form so the debounce sees a stable value and doesn't re-render forever.
  const payload = useMemo<TargetGroupInput>(() => (f.channel === 'cinema'
    ? { ...f, name: f.name.trim(), doohTypes: [] }
    : { ...f, name: f.name.trim(), geo: { ...f.geo, screenIds: [], screenCategories: [], formats: [] }, interest: { genres: [], ratings: [], languages: [] }, advanced: { movies: [], actors: [] } }), [f]);
  const debounced = useDebounced(payload, 400);
  const reach = useQuery({
    queryKey: ['reach-preview', debounced],
    queryFn: () => advertiserApi.previewReach(debounced),
    placeholderData: keepPreviousData
  });

  const save = useMutation({
    mutationFn: () => (id ? advertiserApi.updateTargetGroup(id, payload) : advertiserApi.createTargetGroup(payload)),
    onSuccess: tg => {
      qc.invalidateQueries({ queryKey: qk.targetGroups });
      notifySuccess(`${tg.name} saved.`);
      navigate('/target-groups');
    }
  });
  const nameError = touched && !f.name.trim() ? 'Give the target group a name.' : undefined;

  // Built from the normalised payload, so cinema-only filters vanish from the summary when the channel is DOOH.
  const pg = payload.geo;
  const selected = [
    ...pg.countries, ...pg.states, ...pg.cities,
    ...pg.theatreIds.map(t => theatres.find(x => x.id === t)?.name ?? t),
    ...(pg.screenIds.length ? [`${pg.screenIds.length} screens`] : []),
    ...pg.theatreCategories, ...pg.screenCategories, ...pg.formats,
    ...(f.channel === 'cinema' ? [...f.interest.genres, ...f.interest.ratings, ...f.interest.languages, ...f.advanced.movies, ...f.advanced.actors] : f.doohTypes)
  ];
  const unitLabel = f.channel === 'cinema' ? 'Screens' : 'Display groups';

  return (
    <div className="sl-grid sl-grid--aside">
      <div className="sl-stack">
        <Card title="Basics">
          <div className="sl-stack">
            <Input label="Target group name" value={f.name} onChange={name => setF({ ...f, name })} errorMessage={nameError} isReadOnly={!editable} placeholder="e.g. Metro Premium — Festive" />
            <Field label="Channel" hint={channelLocked
              ? 'Used by campaigns, so the channel can’t change. Create a new group for the other channel.'
              : 'Cinema groups resolve to screens; DOOH groups resolve to the display groups your sales house has configured.'}>
              <ChoiceCards label="Channel" value={f.channel} onChange={channel => setF({ ...f, channel })} options={[
                { value: 'cinema', title: 'Cinema', hint: 'On-screen spots before and during the film.', disabled: channelLocked && f.channel !== 'cinema' },
                { value: 'dooh', title: 'DOOH', hint: 'Lobby, foyer and concourse displays.', disabled: channelLocked && f.channel !== 'dooh' }
              ]} />
            </Field>
          </div>
        </Card>

        <Card title="Geographic" description="Where the media plays. Leave a dimension empty to include everything you can book.">
          <div className="sl-stack">
            <Field label="Country"><ChipToggle label="Country" options={opts.countries} value={geo.countries} onChange={countries => setGeo({ countries })} /></Field>
            <Field label="State"><ChipToggle label="State" options={opts.states} value={geo.states} onChange={states => setGeo({ states })} /></Field>
            <Field label="City"><ChipToggle label="City" options={opts.cities} value={geo.cities} onChange={cities => setGeo({ cities })} /></Field>
            <Field label="Cinema" hint="Picking a cinema includes all of its screens."><IdChips label="Cinema" options={opts.theatres} value={geo.theatreIds} onChange={theatreIds => setGeo({ theatreIds })} /></Field>
            {f.channel === 'cinema' && (
              <Select<{ id: string; label: string }, 'multiple'> label="Specific screens" selectionMode="multiple" items={opts.screens} value={geo.screenIds}
                onChange={keys => setGeo({ screenIds: keys.map(String) })} placeholder="Any screen" description="Optional — adds individual auditoriums. A selected cinema already includes all of its screens.">
                {s => <Select.Option id={s.id} textValue={s.label}>{s.label}</Select.Option>}
              </Select>
            )}
            <Field label="Cinema category"><ChipToggle label="Cinema category" options={THEATRE_CATEGORIES} value={geo.theatreCategories} onChange={v => setGeo({ theatreCategories: v as typeof geo.theatreCategories })} /></Field>
            {f.channel === 'cinema' && <>
              <Field label="Screen category"><ChipToggle label="Screen category" options={SCREEN_CATEGORIES} value={geo.screenCategories} onChange={v => setGeo({ screenCategories: v as typeof geo.screenCategories })} /></Field>
              <Field label="Screen format"><ChipToggle label="Screen format" options={SCREEN_FORMATS} value={geo.formats} onChange={v => setGeo({ formats: v as typeof geo.formats })} /></Field>
            </>}
          </div>
        </Card>

        {f.channel === 'cinema' ? <>
          <Card title="Interest" description="Which shows play the ad. These narrow the shows, not the screens, so reach doesn't change.">
            <div className="sl-stack">
              <Field label="Genre"><ChipToggle label="Genre" options={GENRES} value={f.interest.genres} onChange={genres => setF({ ...f, interest: { ...f.interest, genres } })} /></Field>
              <Field label="Movie rating"><ChipToggle label="Movie rating" options={RATINGS} value={f.interest.ratings} onChange={ratings => setF({ ...f, interest: { ...f.interest, ratings } })} /></Field>
              <Field label="Movie language"><ChipToggle label="Movie language" options={LANGUAGES} value={f.interest.languages} onChange={languages => setF({ ...f, interest: { ...f.interest, languages } })} /></Field>
            </div>
          </Card>
          <Card title="Advanced" description="Attach to specific titles or cast. Type a name and press Enter.">
            <div className="adv-form">
              <TagInput label="Specific movies" placeholder="e.g. Kantara Chapter 2" value={f.advanced.movies} onChange={movies => setF({ ...f, advanced: { ...f.advanced, movies } })} />
              <TagInput label="Specific actors" placeholder="e.g. Shah Rukh Khan" value={f.advanced.actors} onChange={actors => setF({ ...f, advanced: { ...f.advanced, actors } })} />
            </div>
          </Card>
        </> : (
          <Card title="Display types" description="Which DOOH display groups to reach. Leave empty for all types.">
            <ChipToggle label="Display types" options={[...DOOH_TYPES]} value={f.doohTypes} onChange={v => setF({ ...f, doohTypes: v as typeof f.doohTypes })} />
          </Card>
        )}
      </div>

      <div className="sl-stack adv-rail">
        <Card title="Estimated reach" description="Inventory you can book with these criteria.">
          <div className="sl-stack">
            {reach.isLoading ? <Loading rows={2} /> : reach.error ? (
              <Alert variant="negative" closable={false}>{errorText(reach.error)}</Alert>
            ) : reach.data && (
              <div className="adv-metrics" aria-live="polite" style={{ opacity: reach.isPlaceholderData ? 0.6 : 1 }}>
                <div className="adv-metric"><strong>{num(reach.data.units)}</strong><span>{unitLabel}</span></div>
                <div className="adv-metric"><strong>{num(reach.data.theatres)}</strong><span>Cinemas</span></div>
                <div className="adv-metric"><strong>{num(reach.data.cities)}</strong><span>Cities</span></div>
              </div>
            )}
            {reach.data?.units === 0 && <Alert variant="notice" closable={false} inline>Nothing you can book matches. Loosen a dimension.</Alert>}
            <div className="sl-stack" style={{ gap: 6 }}>
              <span className="adv-field__label">Selected criteria</span>
              {selected.length
                ? <div className="sl-row">{selected.map((s, i) => <Tag key={`${s}-${i}`} size="small" variant="secondary">{s}</Tag>)}</div>
                : <span className="sl-muted sl-small">Nothing selected — the group covers your entire bookable network.</span>}
            </div>
            {save.error && <Alert variant="negative" closable={false}>{errorText(save.error)}</Alert>}
            {editable && (
              <div className="sl-row">
                <Button variant="primary" isPending={save.isPending} onPress={() => { setTouched(true); if (f.name.trim()) save.mutate(); }}>Save target group</Button>
                <Button variant="default" onPress={() => navigate('/target-groups')}>Cancel</Button>
              </div>
            )}
          </div>
        </Card>
        {reach.data && reach.data.sample.length > 0 && (
          <Card title="Matching cinemas · sample" flush>
            <div className="adv-list">
              {reach.data.sample.map(c => (
                <div key={c.id} className="adv-list__item">
                  <div className="adv-list__main"><span className="sl-table__primary">{c.name}</span><span className="sl-table__secondary">{c.city}</span></div>
                  <span className="sl-muted sl-small">{c.units} {f.channel === 'cinema' ? (c.units === 1 ? 'screen' : 'screens') : (c.units === 1 ? 'display group' : 'display groups')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Drops selections that a parent geography no longer allows (e.g. Mumbai after switching the
 * state to Telangana), so nothing invisible stays in the payload and zeroes the reach.
 */
function reconcileGeo(geo: TargetGroupInput['geo'], theatres: Theatre[]): TargetGroupInput['geo'] {
  const inCountry = theatres.filter(t => !geo.countries.length || geo.countries.includes(t.country));
  const states = geo.states.filter(s => inCountry.some(t => t.state === s));
  const inState = inCountry.filter(t => !states.length || states.includes(t.state));
  const cities = geo.cities.filter(c => inState.some(t => t.city === c));
  const inCity = inState.filter(t => !cities.length || cities.includes(t.city));
  const theatreIds = geo.theatreIds.filter(id => inCity.some(t => t.id === id));
  const screenIds = geo.screenIds.filter(id => inCity.some(t => t.screens.some(s => s.id === id)));
  return { ...geo, states, cities, theatreIds, screenIds };
}
