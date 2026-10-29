import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, useSession, type AdminBrandRow } from '@slate/api';
import { APPROVAL_TONE, brandMappings, dateTime, orDash, pathLabel, type BrandProduct, type BrandVariant, type MappingSource } from '@slate/domain';
import { Alert, Button, CategoryChips, CategoryField, Dialog, EmptyState, ErrorState, Input, Loading, Sheet, StatusTag, toast, useCategories } from '@slate/ui';
import { AddIcon, DeleteIcon, EditIcon } from 'prefab/icons';
import { errorMessage } from '../../components/errors';

type Dlg =
  | { kind: 'brand' }
  | { kind: 'product'; product?: BrandProduct }
  | { kind: 'variant'; product: BrandProduct; variant?: BrandVariant }
  | { kind: 'delete-product'; product: BrandProduct }
  | { kind: 'delete-variant'; product: BrandProduct; variant: BrandVariant };

const SOURCE_LABEL: Record<MappingSource, string> = { brand: 'Brand', product: 'Product', variant: 'Variant' };
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/** Brand › Product › Variant detail with the category mappings at each level. Writes need `catalog.manage`. */
export function BrandSheet({ brandId, onClose }: { brandId: string; onClose: () => void }) {
  const { can } = useSession();
  const canManage = can('catalog.manage');
  const cats = useCategories();
  const q = useQuery({ queryKey: ['admin', 'brands', 'one', brandId], queryFn: () => adminApi.brand(brandId) });
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const b = q.data;
  const nodes = useMemo(() => cats.data ?? [], [cats.data]);
  const pathsOf = (ids: string[]) => ids.map(i => pathLabel(nodes, i)).filter(Boolean);

  return (
    <>
      <Sheet isOpen onOpenChange={o => !o && !dlg && onClose()} size={640}>
        <Sheet.Header>{b?.name ?? 'Brand'}</Sheet.Header>
        <Sheet.Body>
          {!b ? (q.isLoading ? <Loading rows={5} /> : <ErrorState error={q.error} onRetry={() => void q.refetch()} />) : (
            <div className="sl-stack" style={{ gap: 20 }}>
              <section className="sl-stack" style={{ gap: 8 }} aria-label="Brand details">
                <div className="sl-row" style={{ justifyContent: 'space-between' }}>
                  <StatusTag tone={APPROVAL_TONE[b.status] ?? 'default'}>{cap(b.status)}</StatusTag>
                  {canManage && <Button variant="default" size="small" onPress={() => setDlg({ kind: 'brand' })}><EditIcon />Edit brand</Button>}
                </div>
                <dl className="sl-kv" style={{ margin: 0, display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px 12px', fontSize: 13 }}>
                  <dt className="sl-muted">Advertiser</dt><dd style={{ margin: 0 }}>{b.companyName}</dd>
                  <dt className="sl-muted">SAC</dt><dd style={{ margin: 0 }}>{b.sacName}</dd>
                  <dt className="sl-muted">Requested</dt><dd style={{ margin: 0 }}>{dateTime(b.requestedAt)}</dd>
                  <dt className="sl-muted">Reviewed</dt><dd style={{ margin: 0 }}>{dateTime(b.reviewedAt)}</dd>
                  <dt className="sl-muted">SAC note</dt><dd style={{ margin: 0 }}>{orDash(b.note)}</dd>
                </dl>
                <p className="sl-muted sl-small" style={{ margin: 0 }}>Approval is decided by the SAC; you can edit the brand’s name, products, variants and categories.</p>
              </section>

              <section className="sl-stack" style={{ gap: 8 }} aria-label="Category mappings">
                <h3 style={{ margin: 0, fontSize: 14 }}>Categories</h3>
                <CategoryChips paths={b.categoryPaths} />
                <MappingList brand={b} pathsOf={pathsOf} />
              </section>

              <section className="sl-stack" style={{ gap: 8 }} aria-label="Products and variants">
                <div className="sl-row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>{b.name} › Products › Variants</h3>
                  {canManage && <Button variant="default" size="small" onPress={() => setDlg({ kind: 'product' })}><AddIcon />Add product</Button>}
                </div>
                {b.products.length === 0 && <EmptyState title="No products yet">{canManage ? 'Add the first product, then its variants.' : 'No products have been added.'}</EmptyState>}
                {b.products.map(p => (
                  <div key={p.id} className="sl-card" style={{ padding: '10px 12px' }}>
                    <div className="sl-node" style={{ padding: 0 }}>
                      <span className="sl-node__name" style={{ flexWrap: 'wrap' }}><strong>{p.name}</strong><CategoryChips paths={pathsOf(p.categoryIds)} /></span>
                      {canManage && (
                        <span className="sl-node__actions">
                          <Button variant="default" size="small" iconOnly aria-label={`Add variant to ${p.name}`} onPress={() => setDlg({ kind: 'variant', product: p })}><AddIcon /></Button>
                          <Button variant="default" size="small" iconOnly aria-label={`Edit ${p.name}`} onPress={() => setDlg({ kind: 'product', product: p })}><EditIcon /></Button>
                          <Button variant="default" size="small" iconOnly aria-label={`Delete ${p.name}`} onPress={() => setDlg({ kind: 'delete-product', product: p })}><DeleteIcon /></Button>
                        </span>
                      )}
                    </div>
                    {p.variants.map(v => (
                      <div key={v.id} className="sl-node sl-node--l3" style={{ paddingLeft: 20 }}>
                        <span className="sl-node__name" style={{ flexWrap: 'wrap' }}>{v.name}<CategoryChips paths={pathsOf(v.categoryIds)} /></span>
                        {canManage && (
                          <span className="sl-node__actions">
                            <Button variant="default" size="small" iconOnly aria-label={`Edit ${v.name}`} onPress={() => setDlg({ kind: 'variant', product: p, variant: v })}><EditIcon /></Button>
                            <Button variant="default" size="small" iconOnly aria-label={`Delete ${v.name}`} onPress={() => setDlg({ kind: 'delete-variant', product: p, variant: v })}><DeleteIcon /></Button>
                          </span>
                        )}
                      </div>
                    ))}
                    {p.variants.length === 0 && <p className="sl-muted sl-small" style={{ margin: '4px 0 0 20px' }}>No variants.</p>}
                  </div>
                ))}
              </section>
            </div>
          )}
        </Sheet.Body>
        <Sheet.Footer><Button variant="default" onPress={onClose}>Close</Button></Sheet.Footer>
      </Sheet>
      {b && dlg && <BrandDialogs brand={b} dlg={dlg} onClose={() => setDlg(null)} />}
    </>
  );
}

/** Where each mapping comes from, so it is clear whether a category was set on the brand, a product or a variant. */
function MappingList({ brand, pathsOf }: { brand: AdminBrandRow; pathsOf: (ids: string[]) => string[] }) {
  const rows = brandMappings(brand).map(m => ({ ...m, path: pathsOf([m.categoryId])[0] })).filter((m): m is typeof m & { path: string } => !!m.path);
  if (!rows.length) return <p className="sl-muted sl-small" style={{ margin: 0 }}>No category mappings yet. Edit the brand, a product or a variant to add some.</p>;
  return (
    <table className="sl-table" aria-label="Mappings by level">
      <thead><tr><th>Category</th><th>Mapped on</th><th>Name</th></tr></thead>
      <tbody>
        {rows.map((m, i) => (
          <tr key={`${m.categoryId}-${m.source}-${m.owner}-${i}`}>
            <td>{m.path}</td>
            <td><StatusTag tone={m.source === 'brand' ? 'primary-secondary' : m.source === 'product' ? 'default' : 'secondary'}>{SOURCE_LABEL[m.source]}</StatusTag></td>
            <td>{m.owner}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Refreshed brand row goes straight into the cache so the sheet and the list agree. */
function useBrandMutation<V>(brandId: string, fn: (v: V) => Promise<AdminBrandRow>, message: (b: AdminBrandRow, v: V) => string, onDone: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (row, v) => {
      qc.setQueryData(['admin', 'brands', 'one', brandId], row);
      void qc.invalidateQueries({ queryKey: ['admin', 'brands', 'page'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.add({ variant: 'positive', message: message(row, v) });
      onDone();
    }
  });
}

function BrandDialogs({ brand, dlg, onClose }: { brand: AdminBrandRow; dlg: Dlg; onClose: () => void }) {
  if (dlg.kind === 'brand') return <NameCategoriesDialog key="brand" title="Edit brand" label="Brand name" initialName={brand.name} initialIds={brand.categoryIds} siblings={[]}
    save={(name, categoryIds) => adminApi.updateBrand(brand.id, { name, categoryIds })} brandId={brand.id} done={`${brand.name} updated.`} onClose={onClose} />;
  if (dlg.kind === 'product') {
    const p = dlg.product;
    return <NameCategoriesDialog key={p?.id ?? 'new-product'} title={p ? `Edit product` : `Add product to ${brand.name}`} label="Product name" initialName={p?.name ?? ''} initialIds={p?.categoryIds ?? []}
      siblings={brand.products.filter(x => x.id !== p?.id).map(x => x.name)}
      save={(name, categoryIds) => (p ? adminApi.updateProduct(brand.id, p.id, { name, categoryIds }) : adminApi.addProduct(brand.id, { name, categoryIds }))}
      brandId={brand.id} done={p ? 'Product updated.' : 'Product added.'} onClose={onClose} />;
  }
  if (dlg.kind === 'variant') {
    const { product: p, variant: v } = dlg;
    return <NameCategoriesDialog key={v?.id ?? `new-variant-${p.id}`} title={v ? 'Edit variant' : `Add variant to ${p.name}`} label="Variant name" initialName={v?.name ?? ''} initialIds={v?.categoryIds ?? []}
      siblings={p.variants.filter(x => x.id !== v?.id).map(x => x.name)}
      save={(name, categoryIds) => (v ? adminApi.updateVariant(brand.id, p.id, v.id, { name, categoryIds }) : adminApi.addVariant(brand.id, p.id, { name, categoryIds }))}
      brandId={brand.id} done={v ? 'Variant updated.' : 'Variant added.'} onClose={onClose} />;
  }
  return <DeleteItemDialog brand={brand} dlg={dlg} onClose={onClose} />;
}

function NameCategoriesDialog({ title, label, initialName, initialIds, siblings, save, brandId, done, onClose }: {
  title: string; label: string; initialName: string; initialIds: string[]; siblings: string[];
  save: (name: string, categoryIds: string[]) => Promise<AdminBrandRow>; brandId: string; done: string; onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [ids, setIds] = useState(initialIds);
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const clash = siblings.some(s => s.toLowerCase() === trimmed.toLowerCase());
  const err = !trimmed ? 'Enter a name.' : clash ? `“${trimmed}” already exists here.` : null;
  const m = useBrandMutation(brandId, () => save(trimmed, ids), () => done, onClose);
  const close = () => { if (!m.isPending) onClose(); };
  return (
    <Dialog isOpen onOpenChange={o => !o && close()} width={520}>
      <Dialog.Header>{title}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack">
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          <form id="brand-item" className="sl-stack" onSubmit={e => { e.preventDefault(); setTouched(true); if (!err && !m.isPending) m.mutate(undefined); }}>
            <Input label={label} value={name} onChange={setName} isRequired autoFocus isInvalid={touched && !!err} errorMessage={touched && err ? err : undefined} />
          </form>
          <CategoryField label="Categories" value={ids} onChange={setIds} description="Map to a category, sub-category or sub-category 2. You can choose several." />
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={close} isDisabled={m.isPending}>Cancel</Button>
        <Button variant="primary" type="submit" form="brand-item" isPending={m.isPending} isDisabled={touched && !!err}>Save</Button>
      </Dialog.Footer>
    </Dialog>
  );
}

function DeleteItemDialog({ brand, dlg, onClose }: { brand: AdminBrandRow; dlg: Extract<Dlg, { kind: 'delete-product' | 'delete-variant' }>; onClose: () => void }) {
  const isProduct = dlg.kind === 'delete-product';
  const name = isProduct ? dlg.product.name : dlg.variant.name;
  const m = useBrandMutation(brand.id,
    () => (dlg.kind === 'delete-product' ? adminApi.deleteProduct(brand.id, dlg.product.id) : adminApi.deleteVariant(brand.id, dlg.product.id, dlg.variant.id)),
    () => `${name} deleted.`, onClose);
  const close = () => { if (!m.isPending) onClose(); };
  const variants = isProduct ? dlg.product.variants.length : 0;
  return (
    <Dialog isOpen onOpenChange={o => !o && close()} role="alertdialog" width={440}>
      <Dialog.Header>{`Delete ${name}?`}</Dialog.Header>
      <Dialog.Body>
        <div className="sl-stack" style={{ gap: 12 }}>
          {m.error && <Alert variant="negative" inline closable={false}>{errorMessage(m.error)}</Alert>}
          <p style={{ margin: 0 }}>
            {isProduct && variants > 0 ? `This removes the product and its ${variants} variant${variants === 1 ? '' : 's'}, with their category mappings.` : 'This removes it and its category mappings.'}
          </p>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={close} isDisabled={m.isPending}>Cancel</Button>
        <Button variant="negative" isPending={m.isPending} onPress={() => m.mutate(undefined)}>Delete</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
