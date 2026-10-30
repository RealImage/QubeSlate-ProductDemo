import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, useSession, type CategoryMaster } from '@slate/api';
import { CATEGORY_LEVEL_LABEL, childrenOf, nodeNameError, normaliseName, pathLabel, subtreeIds, type CategoryNode } from '@slate/domain';
import { Alert, Button, Card, Dialog, EmptyState, ErrorState, Input, Loading, Page, PageHeader, toast } from '@slate/ui';
import { AddIcon, ChevronDownIcon, ChevronRightIcon, DeleteIcon, EditIcon } from 'prefab/icons';
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
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action | null>(null);

  const nodes = useMemo(() => master.data?.nodes ?? [], [master.data]);
  const usage = master.data?.usage ?? {};
  const roots = useMemo(() => childrenOf(nodes, null), [nodes]);
  const parents = useMemo(() => new Set(nodes.flatMap(n => (n.parentId ? [n.parentId] : []))), [nodes]);
  const q = search.trim().toLowerCase();
  /** While searching: the matches, their ancestors (so the path shows) and their descendants. Null when not searching. */
  const visible = useMemo(() => {
    if (!q) return null;
    const byId = new Map(nodes.map(n => [n.id, n]));
    const out = new Set<string>();
    for (const m of nodes.filter(n => n.name.toLowerCase().includes(q))) {
      for (const id of subtreeIds(nodes, m.id)) out.add(id);
      for (let p = m.parentId ? byId.get(m.parentId) : undefined; p; p = p.parentId ? byId.get(p.parentId) : undefined) out.add(p.id);
    }
    return out;
  }, [nodes, q]);

  const toggle = (id: string) => setExpanded(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const expand = (id: string) => setExpanded(s => new Set(s).add(id));

  /** Add (levels 1-2) / rename / delete for one node; revealed on row hover or focus. */
  const actions = (node: CategoryNode) => {
    if (!canManage) return null;
    return (
      <span className="sl-node__actions">
        {node.level < 3 && (
          <Button variant="default" size="small" iconOnly aria-label={`Add ${CATEGORY_LEVEL_LABEL[(node.level + 1) as 2 | 3]} under ${pathLabel(nodes, node.id)}`} onPress={() => setAction({ kind: 'add', parent: node })}><AddIcon /></Button>
        )}
        <Button variant="default" size="small" iconOnly aria-label={`Rename ${pathLabel(nodes, node.id)}`} onPress={() => setAction({ kind: 'rename', node })}><EditIcon /></Button>
        <Button variant="default" size="small" iconOnly aria-label={`Delete ${pathLabel(nodes, node.id)}`} onPress={() => setAction({ kind: 'delete', node })}><DeleteIcon /></Button>
      </span>
    );
  };

  const highlight = (name: string) => {
    const i = q ? name.toLowerCase().indexOf(q) : -1;
    return i < 0 ? name : <>{name.slice(0, i)}<mark>{name.slice(i, i + q.length)}</mark>{name.slice(i + q.length)}</>;
  };

  const branch = (parentId: string | null): ReactNode => {
    const kids = childrenOf(nodes, parentId).filter(n => !visible || visible.has(n.id));
    if (kids.length === 0) return null;
    return (
      <ul aria-label={parentId ? undefined : 'Categories'}>
        {kids.map(node => {
          const hasKids = parents.has(node.id);
          const open = hasKids && (visible ? true : expanded.has(node.id));
          return (
            <li key={node.id} className={`sl-tree__l${node.level}`}>
              <div className="sl-tree__row">
                {hasKids ? (
                  <button type="button" className="sl-tree__toggle" aria-expanded={open} disabled={!!visible}
                    aria-label={`${open ? 'Collapse' : 'Expand'} ${pathLabel(nodes, node.id)}`} onClick={() => toggle(node.id)}>
                    {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </button>
                ) : <span className="sl-tree__spacer" aria-hidden />}
                <span className="sl-tree__name">
                  <span className="sl-tree__label">{highlight(node.name)}</span>
                  <span className="sl-count">{brandsLabel(usage[node.id] ?? 0)}</span>
                </span>
                {actions(node)}
              </div>
              {open && branch(node.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Page>
      <PageHeader eyebrow="Catalog" title="Category Lists" description="The category master every brand, product and variant maps to: Category › SubCategory 1 › SubCategory 2. Listed alphabetically."
        actions={canManage && <Button variant="primary" onPress={() => setAction({ kind: 'add', parent: null })}><AddIcon />Add category</Button>} />
      {!master.data ? (
        <Card flush>{master.isLoading ? <Loading rows={6} /> : <ErrorState error={master.error} onRetry={() => void master.refetch()} />}</Card>
      ) : roots.length === 0 ? (
        <Card><EmptyState title="No categories yet">Add the first category to get started.</EmptyState></Card>
      ) : (
        <Card flush title={`Categories (${roots.length})`}>
          <div className="sl-tree__tools">
            <Input label="Search categories" placeholder="Category or sub-category" value={search} onChange={setSearch} />
            <Button variant="default" isDisabled={!!visible} onPress={() => setExpanded(new Set(parents))}>Expand all</Button>
            <Button variant="default" isDisabled={!!visible || expanded.size === 0} onPress={() => setExpanded(new Set())}>Collapse all</Button>
          </div>
          {visible?.size === 0 ? <EmptyState title="No categories match">Try a different search.</EmptyState> : (
            <div className="sl-tree">{branch(null)}</div>
          )}
        </Card>
      )}
      {action && (action.kind === 'delete'
        ? <DeleteDialog node={action.node} master={master.data!} onClose={() => setAction(null)} />
        : <NameDialog key={action.kind === 'rename' ? action.node.id : action.parent?.id ?? 'root'} action={action} nodes={nodes}
            onClose={added => { if (added && action.kind === 'add' && action.parent) expand(action.parent.id); setAction(null); }} />)}
    </Page>
  );
}

function NameDialog({ action, nodes, onClose }: { action: Exclude<Action, { kind: 'delete' }>; nodes: CategoryNode[]; onClose: (added?: boolean) => void }) {
  const renaming = action.kind === 'rename';
  const parentId = renaming ? action.node.parentId : action.parent?.id ?? null;
  const level = renaming ? action.node.level : ((action.parent?.level ?? 0) + 1) as 1 | 2 | 3;
  const [name, setName] = useState(renaming ? action.node.name : '');
  const [touched, setTouched] = useState(false);
  const err = nodeNameError(nodes, parentId, name, renaming ? action.node.id : undefined);
  const m = useMasterMutation(
    () => (renaming ? adminApi.renameCategory(action.node.id, normaliseName(name)) : adminApi.addCategory({ parentId, name: normaliseName(name) })),
    () => {
      toast.add({ variant: 'positive', message: renaming ? `Renamed to ${normaliseName(name)}.` : `${normaliseName(name)} added.` });
      onClose(!renaming);
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
