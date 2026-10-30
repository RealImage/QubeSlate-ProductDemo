import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, useSession, type CategoryMaster } from '@slate/api';
import { CATEGORY_LEVEL_LABEL, childrenOf, nodeNameError, normaliseName, pathLabel, subtreeIds, type CategoryNode } from '@slate/domain';
import { Alert, Button, Card, Dialog, EmptyState, ErrorState, Input, Loading, Page, PageHeader, toast } from '@slate/ui';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, ChevronRightIcon, DeleteIcon, EditIcon } from 'prefab/icons';
import { errorMessage } from '../../components/errors';

type Action =
  | { kind: 'add'; parent: CategoryNode | null }
  | { kind: 'rename'; node: CategoryNode }
  | { kind: 'delete'; node: CategoryNode };

const brandsLabel = (n: number) => `${n} brand${n === 1 ? '' : 's'}`;

/** After any master change, every screen that shows categories refetches. */
function useMasterMutation<V>(fn: (v: V) => Promise<CategoryMaster>, onDone?: (m: CategoryMaster, v: V) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (m, v) => {
      qc.setQueryData(['admin', 'categories'], m);
      void qc.invalidateQueries({ queryKey: ['categories'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'brands'] });
      onDone?.(m, v);
    }
  });
}

export function CategoriesPage() {
  const { can } = useSession();
  const canManage = can('catalog.manage');
  const master = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categoryMaster });
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action | null>(null);

  const nodes = useMemo(() => master.data?.nodes ?? [], [master.data]);
  const usage = master.data?.usage ?? {};
  const roots = useMemo(() => childrenOf(nodes, null), [nodes]);
  const q = search.trim().toLowerCase();
  const shownRoots = useMemo(() => {
    if (!q) return roots;
    return roots.filter(r => [...subtreeIds(nodes, r.id)].some(id => nodes.find(n => n.id === id)?.name.toLowerCase().includes(q)));
  }, [roots, nodes, q]);
  const current = nodes.find(n => n.id === selected && n.level === 1) ?? shownRoots[0] ?? roots[0] ?? null;

  const move = useMasterMutation(({ id, dir }: { id: string; dir: 'up' | 'down' }) => adminApi.moveCategory(id, dir));
  const onMove = (node: CategoryNode, dir: 'up' | 'down') => move.mutate({ id: node.id, dir }, { onError: e => toast.add({ variant: 'negative', message: errorMessage(e) }) });
  const toggle = (id: string) => setCollapsed(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  /** Up / down / rename / delete (and add for levels 1-2) for one node. */
  const actions = (node: CategoryNode) => {
    if (!canManage) return null;
    const sibs = childrenOf(nodes, node.parentId);
    const i = sibs.findIndex(s => s.id === node.id);
    return (
      <span className="sl-node__actions">
        {node.level < 3 && (
          <Button variant="default" size="small" iconOnly aria-label={`Add ${CATEGORY_LEVEL_LABEL[(node.level + 1) as 2 | 3]} under ${node.name}`} onPress={() => setAction({ kind: 'add', parent: node })}><AddIcon /></Button>
        )}
        <Button variant="default" size="small" iconOnly aria-label={`Move ${node.name} up`} isDisabled={i <= 0 || move.isPending} onPress={() => onMove(node, 'up')}><ArrowUpIcon /></Button>
        <Button variant="default" size="small" iconOnly aria-label={`Move ${node.name} down`} isDisabled={i === sibs.length - 1 || move.isPending} onPress={() => onMove(node, 'down')}><ArrowDownIcon /></Button>
        <Button variant="default" size="small" iconOnly aria-label={`Rename ${node.name}`} onPress={() => setAction({ kind: 'rename', node })}><EditIcon /></Button>
        <Button variant="default" size="small" iconOnly aria-label={`Delete ${node.name}`} onPress={() => setAction({ kind: 'delete', node })}><DeleteIcon /></Button>
      </span>
    );
  };

  return (
    <Page>
      <PageHeader eyebrow="Catalog" title="Category Lists" description="The category master every brand, product and variant maps to: Category › SubCategory 1 › SubCategory 2."
        actions={canManage && <Button variant="primary" onPress={() => setAction({ kind: 'add', parent: null })}><AddIcon />Add category</Button>} />
      {!master.data ? (
        <Card flush>{master.isLoading ? <Loading rows={6} /> : <ErrorState error={master.error} onRetry={() => void master.refetch()} />}</Card>
      ) : (
        <div className="sl-split">
          <Card flush title={`Categories (${roots.length})`}>
            <div style={{ padding: '12px 12px 4px' }}><Input label="Search categories" placeholder="Category or sub-category" value={search} onChange={setSearch} /></div>
            {shownRoots.length === 0 ? <EmptyState title="No categories match">Try a different search.</EmptyState> : (
              <ul className="sl-list" aria-label="Categories">
                {shownRoots.map(r => (
                  <li key={r.id}>
                    <button type="button" className="sl-list__item" aria-current={current?.id === r.id} onClick={() => setSelected(r.id)}>
                      <span>{r.name}</span><span className="sl-count">{brandsLabel(usage[r.id] ?? 0)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {current ? (
            <Card flush title={current.name} description={`${CATEGORY_LEVEL_LABEL[1]} · ${brandsLabel(usage[current.id] ?? 0)}`}
              actions={actions(current)}>
              <div style={{ padding: '4px 16px 12px' }}>
                {childrenOf(nodes, current.id).length === 0 && <EmptyState title="No sub-categories yet">Use the add button to create a SubCategory 1.</EmptyState>}
                {childrenOf(nodes, current.id).map(s1 => {
                  const kids = childrenOf(nodes, s1.id);
                  const open = !collapsed.has(s1.id);
                  return (
                    <div key={s1.id}>
                      <div className="sl-node sl-node--l2">
                        <span className="sl-node__name">
                          <Button variant="default" size="small" iconOnly aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${s1.name}`} onPress={() => toggle(s1.id)}>
                            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
                          </Button>
                          {s1.name} <span className="sl-count">· {kids.length} item{kids.length === 1 ? '' : 's'} · {brandsLabel(usage[s1.id] ?? 0)}</span>
                        </span>
                        {actions(s1)}
                      </div>
                      {open && kids.map(s2 => (
                        <div key={s2.id} className="sl-node sl-node--l3">
                          <span className="sl-node__name">{s2.name} <span className="sl-count">· {brandsLabel(usage[s2.id] ?? 0)}</span></span>
                          {actions(s2)}
                        </div>
                      ))}
                      {open && kids.length === 0 && <p className="sl-muted sl-small" style={{ margin: '0 0 8px 30px' }}>No SubCategory 2 items.</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : <Card><EmptyState title="No categories yet">Add the first category to get started.</EmptyState></Card>}
        </div>
      )}
      {action && (action.kind === 'delete'
        ? <DeleteDialog node={action.node} master={master.data!} onClose={() => setAction(null)} />
        : <NameDialog key={action.kind === 'rename' ? action.node.id : action.parent?.id ?? 'root'} action={action} nodes={nodes} onClose={(created) => { setAction(null); if (created) setSelected(created); }} />)}
    </Page>
  );
}

function NameDialog({ action, nodes, onClose }: { action: Exclude<Action, { kind: 'delete' }>; nodes: CategoryNode[]; onClose: (createdRootId?: string) => void }) {
  const renaming = action.kind === 'rename';
  const parentId = renaming ? action.node.parentId : action.parent?.id ?? null;
  const level = renaming ? action.node.level : ((action.parent?.level ?? 0) + 1) as 1 | 2 | 3;
  const [name, setName] = useState(renaming ? action.node.name : '');
  const [touched, setTouched] = useState(false);
  const err = nodeNameError(nodes, parentId, name, renaming ? action.node.id : undefined);
  const m = useMasterMutation(
    () => (renaming ? adminApi.renameCategory(action.node.id, normaliseName(name)) : adminApi.addCategory({ parentId, name: normaliseName(name) })),
    master => {
      toast.add({ variant: 'positive', message: renaming ? `Renamed to ${normaliseName(name)}.` : `${normaliseName(name)} added.` });
      const created = !renaming && level === 1 ? master.nodes.find(n => n.parentId === null && n.name === normaliseName(name))?.id : undefined;
      onClose(created);
    }
  );
  const close = () => { if (!m.isPending) onClose(); };
  const where = !renaming && action.parent ? ` under ${pathLabel(nodes, action.parent.id)}` : '';
  const title = renaming ? `Rename ${CATEGORY_LEVEL_LABEL[level].toLowerCase()}` : `Add ${CATEGORY_LEVEL_LABEL[level].toLowerCase()}${where}`;
  return (
    <Dialog isOpen onOpenChange={o => !o && close()} width={460}>
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>
        <form id="category-name" className="sl-stack" onSubmit={e => { e.preventDefault(); setTouched(true); if (!err && !m.isPending) m.mutate(undefined); }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          <Input label="Name" value={name} onChange={setName} isRequired autoFocus isInvalid={touched && !!err} errorMessage={touched && err ? err : undefined}
            description="Must be unique among its siblings (ignoring capitals)." />
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={close} isDisabled={m.isPending}>Cancel</Button>
        <Button variant="primary" type="submit" form="category-name" isPending={m.isPending} isDisabled={!!err && touched}>{renaming ? 'Save' : 'Add'}</Button>
      </Dialog.Footer>
    </Dialog>
  );
}

function DeleteDialog({ node, master, onClose }: { node: CategoryNode; master: CategoryMaster; onClose: () => void }) {
  // Usage counts already include descendants and all three mapping levels; the server enforces the same rule.
  const used = master.usage[node.id] ?? 0;
  const below = subtreeIds(master.nodes, node.id).size - 1;
  const blocked = used > 0;
  const m = useMasterMutation(() => adminApi.deleteCategory(node.id), () => { toast.add({ variant: 'positive', message: `${node.name} deleted.` }); onClose(); });
  const close = () => { if (!m.isPending) onClose(); };
  return (
    <Dialog isOpen onOpenChange={o => !o && close()} role="alertdialog" width={460}>
      <Dialog.Header>{blocked ? `Can’t delete ${node.name}` : `Delete ${node.name}?`}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack" style={{ gap: 12 }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          {blocked ? (
            <Alert variant="notice" inline closable={false}>
              {`“${node.name}” is used by ${brandsLabel(used)} (directly or through a sub-category, on a brand, product or variant). Remove those mappings first.`}
            </Alert>
          ) : (
            <p style={{ margin: 0 }}>
              {below > 0 ? `This permanently removes ${node.name} and the ${below} sub-categor${below === 1 ? 'y' : 'ies'} below it.` : `This permanently removes ${node.name}.`} No brand uses it.
            </p>
          )}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={close} isDisabled={m.isPending}>{blocked ? 'Close' : 'Cancel'}</Button>
        {!blocked && <Button variant="negative" isPending={m.isPending} onPress={() => m.mutate(undefined)}>Delete</Button>}
      </Dialog.Footer>
    </Dialog>
  );
}
