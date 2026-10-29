import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sacApi, useSession, type DoohConfigInput, type TheatreRow } from '@slate/api';
import { DOOH_TYPES, crossesMidnight, dateTime, num, validateDoohGroup, type DoohGroup, type DoohLoopMode, type DoohOrientation, type DoohScreenMode, type DoohType } from '@slate/domain';
import { Alert, Button, Card, ChoiceCards, ConfirmDialog, DataTable, Dialog, EmptyState, Input, Page, PageHeader, Query, Select, Sheet, StatCard, StatusTag, toast } from '@slate/ui';
import { FormError } from '../shared';

type Hours = DoohConfigInput['hours'];
// Theatre and SAC are assigned by the server; the editor only handles this SAC's own groups.
type DraftGroup = Omit<DoohGroup, 'theatreId' | 'sacId'>;
interface Draft { hours: Hours; groups: DraftGroup[] }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LOOP_HINTS: Record<DoohLoopMode, string> = {
  'Scheduled': 'Loop duration is configured for this display group.',
  'Synchronized with Screen': 'Follows the playback loop of the connected signage system. No loop duration is set in Slate.',
  'Free Duration': 'Not constrained by a fixed loop; playback length follows the scheduled content.'
};
const MODE_HINTS: Record<DoohScreenMode, string> = {
  'Independent Screens': 'Each physical screen can play different content.',
  'Synchronized Screens': 'All screens play the same content at the same time — commercially one advertising unit.',
  'Single Canvas': 'Several panels form one logical display, such as a multi-panel LED wall.'
};
const ORIENTATIONS: DoohOrientation[] = ['Horizontal', 'Vertical', 'Full Container'];
const MODES = Object.keys(MODE_HINTS) as DoohScreenMode[];
const LOOPS = Object.keys(LOOP_HINTS) as DoohLoopMode[];

const toDraft = (t: { hours: Hours; doohGroups: DoohGroup[] }): Draft => ({
  hours: t.hours.map(h => ({ ...h })),
  groups: t.doohGroups.map(({ theatreId: _theatreId, ...g }) => g)
});
const screensOf = (t: Pick<TheatreRow, 'doohGroups'>) => t.doohGroups.reduce((n, g) => n + g.screens, 0);

/** Warns before leaving with unsaved edits: tab close, and clicks on in-app links (sidebar). */
function useLeaveGuard(dirty: boolean, onBlockedLink: (href: string) => void) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.('a[href]');
      const href = a?.getAttribute('href');
      if (!a || !href?.startsWith('/') || a.getAttribute('target') === '_blank') return;
      e.preventDefault();
      e.stopPropagation();
      onBlockedLink(href);
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', click, true); };
  }, [dirty, onBlockedLink]);
}

/* ------------------------------------------------------------------ list */

interface Filters { status: 'all' | 'configured' | 'pending'; location: string; minScreens: string; maxScreens: string; minGroups: string; maxGroups: string; types: DoohType[] }
const NO_FILTERS: Filters = { status: 'all', location: '', minScreens: '', maxScreens: '', minGroups: '', maxGroups: '', types: [] };

function FilterSheet({ open, onClose, filters, setFilters, matches, total }: { open: boolean; onClose: () => void; filters: Filters; setFilters: (f: Filters) => void; matches: number; total: number }) {
  const set = (p: Partial<Filters>) => setFilters({ ...filters, ...p });
  return (
    <Sheet isOpen={open} onOpenChange={o => !o && onClose()} size={400}>
      <Sheet.Header>Filter theatres</Sheet.Header>
      <Sheet.Body>
        <div className="sl-stack" style={{ gap: 20 }}>
          <p className="sl-muted sl-small" style={{ margin: 0 }}>{matches} of {total} theatres match</p>
          <Select label="Theatre status" selectedKey={filters.status} onSelectionChange={k => set({ status: k as Filters['status'] })}>
            <Select.Option id="all">All</Select.Option>
            <Select.Option id="configured">Configured</Select.Option>
            <Select.Option id="pending">Pending</Select.Option>
          </Select>
          <Input label="Location" placeholder="City, state or country" value={filters.location} onChange={location => set({ location })} />
          <div className="sl-grid sl-grid--2">
            <Input label="Min screens" type="number" value={filters.minScreens} onChange={minScreens => set({ minScreens })} />
            <Input label="Max screens" type="number" value={filters.maxScreens} onChange={maxScreens => set({ maxScreens })} />
            <Input label="Min groups" type="number" value={filters.minGroups} onChange={minGroups => set({ minGroups })} />
            <Input label="Max groups" type="number" value={filters.maxGroups} onChange={maxGroups => set({ maxGroups })} />
          </div>
          <div className="sl-stack" style={{ gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Display types configured</span>
            <div className="sl-row" role="group" aria-label="Display types">
              {DOOH_TYPES.map(ty => {
                const on = filters.types.includes(ty);
                return <button key={ty} type="button" className="sl-chip" aria-pressed={on} onClick={() => set({ types: on ? filters.types.filter(x => x !== ty) : [...filters.types, ty] })}>{ty}</button>;
              })}
            </div>
          </div>
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="default" onPress={() => setFilters(NO_FILTERS)}>Clear all</Button>
        <Button variant="primary" onPress={onClose}>Show {matches} theatres</Button>
      </Sheet.Footer>
    </Sheet>
  );
}

function TheatreList({ theatres, onOpen }: { theatres: TheatreRow[]; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [panel, setPanel] = useState(false);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const loc = filters.location.trim().toLowerCase();
    const n = (v: string) => (v === '' ? null : Number(v));
    const [minS, maxS, minG, maxG] = [n(filters.minScreens), n(filters.maxScreens), n(filters.minGroups), n(filters.maxGroups)];
    return theatres.filter(t => {
      const count = screensOf(t);
      const groups = t.doohGroups.length;
      return (!s || `${t.name} ${t.brand} ${t.city} ${t.id}`.toLowerCase().includes(s))
        && (filters.status === 'all' || (filters.status === 'configured') === (count > 0))
        && (!loc || `${t.city} ${t.state} ${t.country}`.toLowerCase().includes(loc))
        && (minS == null || count >= minS) && (maxS == null || count <= maxS)
        && (minG == null || groups >= minG) && (maxG == null || groups <= maxG)
        && (!filters.types.length || filters.types.some(ty => t.doohGroups.some(g => g.type === ty)));
    });
  }, [theatres, search, filters]);

  const activeFilters = [filters.status !== 'all', !!filters.location.trim(), filters.minScreens !== '' || filters.maxScreens !== '', filters.minGroups !== '' || filters.maxGroups !== '', filters.types.length > 0].filter(Boolean).length;
  const configured = theatres.filter(t => screensOf(t) > 0).length;

  return (
    <Page>
      <PageHeader title="Network DOOH" description="Digital advertising surfaces inside each theatre — LED walls, foyer, lobby, concession and corridor screens. This is physical inventory only; sellable capacity is derived by campaign booking." />
      <div className="sl-grid sl-grid--3">
        <StatCard label="Theatres configured" value={`${configured} of ${theatres.length}`} />
        <StatCard label="DOOH screens" value={num(theatres.reduce((n, t) => n + screensOf(t), 0))} />
        <StatCard label="Display groups" value={num(theatres.reduce((n, t) => n + t.doohGroups.length, 0))} />
      </div>
      <div className="sl-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 480 }}><Input label="Search" placeholder="Theatre, chain, city or ID" value={search} onChange={setSearch} /></div>
        <Button variant="default" onPress={() => setPanel(true)}>Filter{activeFilters ? ` (${activeFilters})` : ''}</Button>
        {activeFilters > 0 && <Button variant="link" onPress={() => setFilters(NO_FILTERS)}>Clear filters</Button>}
      </div>
      <Card flush>
        <DataTable
          rows={rows}
          rowKey={t => t.id}
          caption="Theatres and their DOOH configuration"
          pageSize={100}
          defaultSort={{ key: 'updated', dir: 'desc' }}
          empty={<EmptyState title="No theatres match these filters">Widen the screen-count range or clear a filter.</EmptyState>}
          columns={[
            { key: 'name', header: 'Theatre', sort: t => t.name, cell: t => <><div className="sl-table__primary">{t.name}</div><div className="sl-table__secondary">{t.city} · {t.id}</div></> },
            { key: 'brand', header: 'Chain', sort: t => t.brand, cell: t => t.brand },
            {
              key: 'count', header: 'Screen count', align: 'right', sort: screensOf, cell: t => {
                const by = DOOH_TYPES.map(ty => [ty, t.doohGroups.filter(g => g.type === ty).reduce((n, g) => n + g.screens, 0)] as const).filter(([, c]) => c > 0);
                return <span title={by.length ? by.map(([ty, c]) => `${ty}: ${c}`).join('\n') : 'No display groups configured yet.'}>{screensOf(t)}</span>;
              }
            },
            { key: 'groups', header: 'Groups', align: 'right', sort: t => t.doohGroups.length, cell: t => t.doohGroups.length },
            { key: 'status', header: 'Status', sort: t => t.doohStatus, cell: t => <StatusTag tone={t.doohStatus === 'Configured' ? 'positive' : 'default'}>{t.doohStatus}</StatusTag> },
            { key: 'updated', header: 'Updated on', sort: t => t.updatedAt, cell: t => dateTime(t.updatedAt) },
            { key: 'by', header: 'Updated by', sort: t => t.updatedBy, cell: t => t.updatedBy },
            { key: 'act', header: <span className="sr-only">Configure</span>, align: 'right', cell: t => <Button size="small" variant="primary" onPress={() => onOpen(t.id)}>{t.doohStatus === 'Configured' ? 'Configure' : 'Configure DOOH'}</Button> }
          ]}
        />
      </Card>
      <FilterSheet open={panel} onClose={() => setPanel(false)} filters={filters} setFilters={setFilters} matches={rows.length} total={theatres.length} />
    </Page>
  );
}

/* ---------------------------------------------------------------- config */

interface Editor { id: string | null; type: DoohType; name: string; screens: string; orientation: DoohOrientation; mode: DoohScreenMode; loop: DoohLoopMode; loopSecs: string; errors: string[] }

const groupFromEditor = (ed: Editor, id: string): DraftGroup => ({
  id, type: ed.type, name: ed.name.trim(), screens: Number(ed.screens), orientation: ed.orientation, mode: ed.mode, loop: ed.loop,
  loopSecs: ed.loop === 'Scheduled' ? Number(ed.loopSecs) : null
});

function GroupEditor({ ed, setEd, theatre, groups, onSave, onCancel }: { ed: Editor; setEd: (e: Editor) => void; theatre: string; groups: DraftGroup[]; onSave: (g: DraftGroup) => void; onCancel: () => void }) {
  const set = (p: Partial<Editor>) => setEd({ ...ed, ...p });
  const submit = () => {
    const g = groupFromEditor(ed, ed.id ?? '');
    const errors = validateDoohGroup({ ...g, id: ed.id ?? '__new__' }, groups);
    if (errors.length) { set({ errors }); return; }
    onSave(g);
  };
  return (
    <Dialog isOpen onOpenChange={o => !o && onCancel()} width={520}>
      <Dialog.Header>{ed.id ? 'Edit display group' : 'New display group'}</Dialog.Header>
      <Dialog.Body>
        <form className="sl-stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); submit(); }}>
          <p className="sl-muted sl-small" style={{ margin: 0 }}>{ed.type} · {theatre}</p>
          <Input label="Group name" placeholder="Main Foyer LED Wall" value={ed.name} onChange={name => set({ name })} isRequired autoFocus />
          <Input label="Screen count" type="number" value={ed.screens} onChange={screens => set({ screens })} isRequired />
          <Select label="Screen orientation" selectedKey={ed.orientation} onSelectionChange={k => set({ orientation: k as DoohOrientation })}>
            {ORIENTATIONS.map(o => <Select.Option key={o} id={o}>{o}</Select.Option>)}
          </Select>
          <Select label="Screen mode" selectedKey={ed.mode} onSelectionChange={k => set({ mode: k as DoohScreenMode })} description={MODE_HINTS[ed.mode]}>
            {MODES.map(m => <Select.Option key={m} id={m}>{m}</Select.Option>)}
          </Select>
          <div className="sl-stack" style={{ gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Loop duration</span>
            <ChoiceCards label="Loop duration" value={ed.loop} onChange={loop => set({ loop })} options={LOOPS.map(l => ({ value: l, title: l, hint: LOOP_HINTS[l] }))} />
            {ed.loop === 'Scheduled' && <div style={{ maxWidth: 200 }}><Input label="Loop length (seconds)" type="number" value={ed.loopSecs} onChange={loopSecs => set({ loopSecs })} /></div>}
          </div>
          {ed.errors.length > 0 && (
            <Alert variant="negative" closable={false} inline role="alert">
              <ul style={{ margin: 0, paddingLeft: 18 }}>{ed.errors.map(e => <li key={e}>{e}</li>)}</ul>
            </Alert>
          )}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onCancel}>Cancel</Button>
        <Button variant="primary" onPress={submit}>{ed.id ? 'Save group' : 'Add group'}</Button>
      </Dialog.Footer>
    </Dialog>
  );
}

function TheatreConfig({ t, canEdit, onBack }: { t: TheatreRow; canEdit: boolean; onBack: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [base, setBase] = useState<Draft>(() => toDraft(t));
  const [draft, setDraft] = useState<Draft>(base);
  const [open, setOpen] = useState<DoohType[]>(() => (t.doohGroups.length ? [...new Set(t.doohGroups.map(g => g.type))] : ['Foyer']));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<DraftGroup | null>(null);
  const [leave, setLeave] = useState<string | null>(null); // href, or '' for "back to list"
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [seq, setSeq] = useState(0);

  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  useLeaveGuard(dirty, setLeave);

  const edit = (fn: (d: Draft) => Draft) => { if (save.isPending) return; setDraft(fn); setSaved(false); setErrors([]); };
  const total = draft.groups.reduce((n, g) => n + g.screens, 0);

  const save = useMutation({
    mutationFn: () => sacApi.saveDooh(t.id, { hours: draft.hours, groups: draft.groups.map(g => (g.id.startsWith('new:') ? { ...g, id: '' } : g)) }),
    onSuccess: res => {
      const next = toDraft(res);
      setBase(next);
      setDraft(next);
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ['sac', 'theatres'] });
      toast.add({ variant: 'positive', message: `DOOH configuration saved for ${t.name}.` });
    }
  });

  // Editing is locked while a save is in flight, so the server response can't overwrite later edits.
  const editable = canEdit && !save.isPending;

  const onSave = () => {
    const errs = draft.groups.flatMap(g => validateDoohGroup(g, draft.groups).map(e => `${g.name || 'Unnamed group'}: ${e}`));
    if (draft.hours.some(h => !h.open || !h.close)) errs.push('Every day needs opening and closing times.');
    setErrors(errs);
    if (!errs.length) save.mutate();
  };

  const requestBack = () => (dirty ? setLeave('') : onBack());
  const confirmLeave = () => {
    const to = leave;
    setLeave(null);
    // Discard means back to the saved values, even when the link leads to this same screen.
    if (to) { setDraft(base); navigate(to); } else onBack();
  };

  const startNew = (type: DoohType) => {
    setOpen(o => (o.includes(type) ? o : [...o, type]));
    setEditor({ id: null, type, name: '', screens: '1', orientation: 'Horizontal', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: '60', errors: [] });
  };
  const startEdit = (g: DraftGroup) => setEditor({ id: g.id, type: g.type, name: g.name, screens: String(g.screens), orientation: g.orientation, mode: g.mode, loop: g.loop, loopSecs: String(g.loopSecs ?? 60), errors: [] });
  const saveGroup = (g: DraftGroup) => {
    if (!editor) return;
    const id = editor.id;
    if (id) edit(d => ({ ...d, groups: d.groups.map(x => (x.id === id ? g : x)) }));
    else { const n = seq + 1; setSeq(n); edit(d => ({ ...d, groups: [...d.groups, { ...g, id: `new:${n}` }] })); }
    setEditor(null);
  };

  return (
    <Page>
      <div><Button variant="link" onPress={requestBack}>← Network DOOH</Button></div>
      <PageHeader
        title={t.name}
        description={`${t.city} · ${t.id} · ${t.brand}`}
        actions={
          <div className="sl-row">
            {dirty && <span className="sl-small" style={{ color: 'var(--text-notice, #b25e00)' }} role="status">Unsaved changes</span>}
            {saved && !dirty && <span className="sl-small" style={{ color: 'var(--text-positive-alt)' }} role="status">Changes saved</span>}
            <Button variant="default" onPress={requestBack} isDisabled={save.isPending}>{dirty ? 'Cancel' : 'Back'}</Button>
            {canEdit && <Button variant="primary" onPress={onSave} isPending={save.isPending} isDisabled={!dirty}>Save changes</Button>}
          </div>
        }
      />
      {!canEdit && <Alert variant="notice" closable={false} inline>Your role can view but not change DOOH configuration.</Alert>}
      {errors.length > 0 && (
        <Alert variant="negative" closable={false} role="alert" title="Fix these before saving">
          <ul style={{ margin: 0, paddingLeft: 18 }}>{errors.map(e => <li key={e}>{e}</li>)}</ul>
        </Alert>
      )}
      <FormError error={save.error} />
      {draft.groups.length === 0 && (
        <Card>
          <EmptyState title="No Network DOOH inventory configured for this theatre." action={editable && <Button variant="primary" onPress={() => startNew('Lobby')}>Configure DOOH inventory</Button>}>
            Add display groups under a display type to record the digital surfaces this theatre operates.
          </EmptyState>
        </Card>
      )}
      <Card title="Daily operating hours" description="Configured once per theatre. Periods crossing midnight are supported (18:00 – 01:00).">
        <div className="sl-stack" style={{ gap: 8 }}>
          {draft.hours.map((h, i) => (
            <div key={DAYS[i]} className="sl-row" style={{ gap: 14, flexWrap: 'nowrap' }}>
              <span style={{ width: 110, fontSize: 13, fontWeight: 500 }}>{DAYS[i]}</span>
              <input type="time" aria-label={`${DAYS[i]} opens`} value={h.open} disabled={!editable} onChange={e => edit(d => ({ ...d, hours: d.hours.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)) }))} />
              <span className="sl-muted">to</span>
              <input type="time" aria-label={`${DAYS[i]} closes`} value={h.close} disabled={!editable} onChange={e => edit(d => ({ ...d, hours: d.hours.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)) }))} />
              {h.open && h.close && crossesMidnight(h.open, h.close) && <span className="sl-muted sl-small">crosses midnight</span>}
            </div>
          ))}
        </div>
      </Card>
      <div className="sl-row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 15 }}>Display types</h2>
        <span className="sl-muted">Theatre screen count <strong style={{ color: 'var(--sl-text)' }}>{num(total)}</strong> · calculated from display groups</span>
      </div>
      {DOOH_TYPES.map(ty => {
        const groups = draft.groups.filter(g => g.type === ty);
        const n = groups.reduce((s, g) => s + g.screens, 0);
        const isOpen = open.includes(ty);
        return (
          <section key={ty} className="sl-card" style={{ overflow: 'hidden' }}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(o => (isOpen ? o.filter(x => x !== ty) : [...o, ty]))}
              style={{ appearance: 'none', background: 'none', border: 0, margin: 0, font: 'inherit', color: 'inherit', textAlign: 'left', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', padding: '14px 20px' }}>
              <strong>{isOpen ? '▾' : '▸'} {ty}</strong>
              <span className="sl-muted">{n} {n === 1 ? 'screen' : 'screens'}</span>
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--sl-hairline)', padding: '12px 20px 16px' }}>
                {groups.length > 0 ? (
                  <DataTable
                    rows={groups}
                    rowKey={g => g.id}
                    caption={`${ty} display groups`}
                    columns={[
                      { key: 'name', header: 'Display group', cell: g => <span className="sl-table__primary">{g.name}</span> },
                      { key: 'screens', header: 'Screens', align: 'right', cell: g => g.screens },
                      { key: 'orientation', header: 'Orientation', cell: g => g.orientation },
                      { key: 'mode', header: 'Mode', cell: g => g.mode },
                      { key: 'loop', header: 'Loop', cell: g => (g.loop === 'Scheduled' ? `Scheduled — ${g.loopSecs}s` : g.loop) },
                      ...(editable ? [{
                        key: 'act', header: <span className="sr-only">Actions</span>, align: 'right' as const, cell: (g: DraftGroup) => (
                          <span className="sl-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <Button size="small" variant="default" onPress={() => startEdit(g)}>Edit</Button>
                            <Button size="small" variant="default" onPress={() => setDeleting(g)}>Delete</Button>
                          </span>
                        )
                      }] : [])
                    ]}
                  />
                ) : <p className="sl-muted" style={{ margin: '0 0 8px' }}>No display groups configured.</p>}
                {editable && <div style={{ marginTop: 12 }}><Button size="small" variant="default" onPress={() => startNew(ty)}>+ Add display group</Button></div>}
              </div>
            )}
          </section>
        );
      })}
      <p className="sl-muted sl-small" style={{ margin: 0, maxWidth: 760 }}>Screen count is physical inventory. A synchronized group of 8 screens may be sold as a single advertising unit — available seconds, loop position and sellable capacity are resolved by campaign booking, not here.</p>

      {editor && <GroupEditor ed={editor} setEd={setEditor} theatre={t.name} groups={draft.groups.map(g => (g.id === editor.id ? g : g))} onSave={saveGroup} onCancel={() => setEditor(null)} />}
      <ConfirmDialog open={!!deleting} title={`Delete "${deleting?.name ?? ''}"?`} confirmLabel="Delete" tone="negative"
        onConfirm={() => { const id = deleting?.id; setDeleting(null); edit(d => ({ ...d, groups: d.groups.filter(g => g.id !== id) })); }} onCancel={() => setDeleting(null)}>
        This removes {deleting?.screens} configured screens from this theatre once you save. The theatre itself is not affected.
      </ConfirmDialog>
      <ConfirmDialog open={leave !== null} title="You have unsaved changes." confirmLabel="Discard changes" tone="negative" onConfirm={confirmLeave} onCancel={() => setLeave(null)}>
        Discard your changes to this theatre?
      </ConfirmDialog>
    </Page>
  );
}

export function NetworkDooh() {
  const { can } = useSession();
  const q = useQuery({ queryKey: ['sac', 'theatres'], queryFn: sacApi.theatres });
  const [selected, setSelected] = useState<string | null>(null);
  return (
    // With cached data, a failed background refresh shows a notice instead of unmounting an editor with unsaved changes.
    q.data ? (
      <>
        {q.isError && <Alert variant="notice" inline closable={false}>Couldn’t refresh theatres; showing the last loaded data.</Alert>}
        {(() => {
          const t = q.data.find(x => x.id === selected);
          return t
            ? <TheatreConfig key={t.id} t={t} canEdit={can('inventory.edit')} onBack={() => setSelected(null)} />
            : <TheatreList theatres={q.data} onOpen={setSelected} />;
        })()}
      </>
    ) : <Query q={q} rows={6}>{() => null}</Query>
  );
}
