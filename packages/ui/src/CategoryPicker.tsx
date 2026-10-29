import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@slate/api';
import { CATEGORY_LEVEL_LABEL, childrenOf, dedupe, pathLabel, redundantIds, type CategoryNode } from '@slate/domain';
import { Alert, Button, Checkbox, Dialog, Input } from 'prefab';
import { ChevronDownIcon, ChevronRightIcon } from 'prefab/icons';

/** The category master, shared by every portal. Admin edits invalidate the `['categories']` key. */
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories, staleTime: 60_000 });

/** Category paths ("Auto / Automotive / Cars") as compact chips; `--` when there are none. `max` collapses the rest into "+n". */
export function CategoryChips({ paths, max, flagged }: { paths: string[]; max?: number; flagged?: Set<string> }) {
  if (!paths.length) return <span className="sl-muted">--</span>;
  const shown = max ? paths.slice(0, max) : paths;
  const rest = paths.slice(shown.length);
  return (
    <span className="sl-catchips">
      {shown.map(p => <span key={p} className={`sl-catchip${flagged?.has(p) ? ' is-flagged' : ''}`} title={p}>{p}</span>)}
      {rest.length > 0 && <span className="sl-catchip sl-catchip--more" title={rest.join('\n')}>+{rest.length}</span>}
    </span>
  );
}

/** Check boxes at every level of the category tree, with search and the chosen categories shown as removable chips. */
export function CategoryPickerDialog({ nodes, value, title = 'Choose categories', onApply, onClose }: {
  nodes: CategoryNode[];
  value: string[];
  title?: string;
  onApply: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState(() => dedupe(value));
  const [search, setSearch] = useState('');
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const id of value) for (let p: string | null | undefined = byId.get(id)?.parentId; p; p = byId.get(p)?.parentId) s.add(p);
    return s;
  });

  const q = search.trim().toLowerCase();
  // While searching, show every match with its ancestors (for context) and descendants (to pick a narrower one).
  const visible = useMemo(() => {
    if (!q) return null;
    const hit = new Set(nodes.filter(n => n.name.toLowerCase().includes(q)).map(n => n.id));
    const out = new Set<string>();
    for (const n of nodes) {
      if (hit.has(n.id)) out.add(n.id);
      for (let p: string | null | undefined = n.parentId; p; p = byId.get(p)?.parentId) if (hit.has(p)) out.add(n.id);
    }
    for (const id of out) for (let p: string | null | undefined = byId.get(id)?.parentId; p; p = byId.get(p)?.parentId) out.add(p);
    return out;
  }, [q, nodes, byId]);

  const toggle = (id: string, on: boolean) => setSel(s => (on ? dedupe([...s, id]) : s.filter(x => x !== id)));
  const flip = (id: string) => setOpen(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const redundant = useMemo(() => new Set(redundantIds(nodes, sel)), [nodes, sel]);

  const rows: { node: CategoryNode; hasKids: boolean }[] = [];
  const walk = (parentId: string | null) => {
    for (const node of childrenOf(nodes, parentId)) {
      if (visible && !visible.has(node.id)) continue;
      const kids = childrenOf(nodes, node.id);
      rows.push({ node, hasKids: kids.length > 0 });
      if (kids.length && (visible ? true : open.has(node.id))) walk(node.id);
    }
  };
  walk(null);

  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={560}>
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack" style={{ gap: 12 }}>
          <Input label="Search categories" placeholder="e.g. Cars, FMCG, Retail" value={search} onChange={setSearch} autoFocus />
          <div className="sl-cattree" role="group" aria-label="Category tree">
            {rows.length === 0 && <p className="sl-muted sl-small" style={{ margin: 8 }}>No categories match “{search.trim()}”.</p>}
            {rows.map(({ node, hasKids }) => (
              <div key={node.id} className="sl-cattree__row" style={{ paddingLeft: 4 + (node.level - 1) * 22 }}>
                {hasKids ? (
                  <button type="button" className="sl-cattree__toggle" onClick={() => flip(node.id)} disabled={!!visible}
                    aria-expanded={visible ? true : open.has(node.id)} aria-label={`${open.has(node.id) || visible ? 'Collapse' : 'Expand'} ${node.name}`}>
                    {open.has(node.id) || visible ? <ChevronDownIcon width={14} height={14} /> : <ChevronRightIcon width={14} height={14} />}
                  </button>
                ) : <span className="sl-cattree__toggle" aria-hidden />}
                <Checkbox isSelected={sel.includes(node.id)} onChange={on => toggle(node.id, on)} aria-label={`${node.name} (${CATEGORY_LEVEL_LABEL[node.level]})`}>
                  <span className={node.level === 1 ? 'sl-cattree__l1' : undefined}>{node.name}</span>
                </Checkbox>
              </div>
            ))}
          </div>
          <div>
            <div className="sl-small sl-muted" style={{ marginBottom: 6 }}>{sel.length ? `${sel.length} selected` : 'Nothing selected yet'}</div>
            <div className="sl-catchips">
              {sel.map(id => {
                const label = pathLabel(nodes, id);
                if (!label) return null;
                return (
                  <span key={id} className={`sl-catchip sl-catchip--removable${redundant.has(id) ? ' is-flagged' : ''}`}>
                    {label}
                    <button type="button" aria-label={`Remove ${label}`} onClick={() => toggle(id, false)}><span aria-hidden>×</span></button>
                  </span>
                );
              })}
            </div>
          </div>
          {redundant.size > 0 && (
            <Alert variant="notice" inline closable={false}>
              Highlighted categories sit under another selected category, so they add nothing. You can keep them or remove them.
            </Alert>
          )}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" onPress={() => onApply(sel)}>Apply</Button>
      </Dialog.Footer>
    </Dialog>
  );
}

/** A form row: the current categories as chips plus a button that opens the picker. */
export function CategoryField({ label, value, onChange, required, error, description }: {
  label: string;
  value: string[];
  onChange: (ids: string[]) => void;
  required?: boolean;
  error?: string | null;
  description?: string;
}) {
  const cats = useCategories();
  const [picking, setPicking] = useState(false);
  const nodes = cats.data ?? [];
  const paths = value.map(id => pathLabel(nodes, id)).filter(Boolean);
  const flagged = new Set(redundantIds(nodes, value).map(id => pathLabel(nodes, id)));
  return (
    <div className="sl-stack" style={{ gap: 6 }}>
      <div className="sl-catfield__label">{label}{required ? <span aria-hidden> *</span> : <span className="sl-muted"> (optional)</span>}</div>
      {description && <div className="sl-small sl-muted">{description}</div>}
      <div className="sl-catfield">
        <CategoryChips paths={paths} flagged={flagged} />
        <Button variant="default" size="small" onPress={() => setPicking(true)} isDisabled={!cats.data}>
          {cats.isLoading ? 'Loading…' : paths.length ? 'Edit categories' : 'Choose categories'}
        </Button>
      </div>
      {flagged.size > 0 && <div className="sl-small" style={{ color: 'var(--sl-warn, #8a5a00)' }}>Some categories sit under another chosen category and are redundant.</div>}
      {cats.error && <div className="sl-small" role="alert" style={{ color: 'var(--sl-danger, #b42318)' }}>Could not load categories.</div>}
      {error && <div className="sl-small" role="alert" style={{ color: 'var(--sl-danger, #b42318)' }}>{error}</div>}
      {picking && <CategoryPickerDialog nodes={nodes} value={value} onApply={ids => { onChange(ids); setPicking(false); }} onClose={() => setPicking(false)} />}
    </div>
  );
}
