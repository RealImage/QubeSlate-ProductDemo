import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminBrandRow, type BrandSortKey } from '@slate/api';
import { APPROVAL_TONE, childrenOf, date, num } from '@slate/domain';
import { Card, CategoryChips, DataTable, EmptyState, ErrorState, Loading, Page, PageHeader, Pagination, StatusTag, useCategories, type Column, type SortState } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter, useDebounced } from '../../components/Filters';
import { useSacs } from '../../components/queries';
import { BrandSheet } from './BrandSheet';

const PAGE_SIZE = 100;
const STATUS_OPTIONS = [{ value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }];
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

export function BrandsPage() {
  const [search, setSearch] = useState('');
  const [sacId, setSacId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [q, sacId, status, categoryId, sort]);

  const sacs = useSacs();
  const cats = useCategories();
  const topLevel = useMemo(() => childrenOf(cats.data ?? [], null).map(c => ({ value: c.id, label: c.name })), [cats.data]);

  // Column keys double as the server's sort keys, so sorting covers every brand, not just this page.
  const query = {
    q: q || undefined, sacId: sacId === ALL ? undefined : sacId, status: status === ALL ? undefined : (status as AdminBrandRow['status']),
    categoryId: categoryId === ALL ? undefined : categoryId, sort: sort.key as BrandSortKey, dir: sort.dir, page, pageSize: PAGE_SIZE
  };
  const list = useQuery({ queryKey: ['admin', 'brands', 'page', query], queryFn: () => adminApi.brands(query), placeholderData: keepPreviousData });
  const d = list.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.pageSize)) : 1;
  useEffect(() => { if (d && page > pages) setPage(pages); }, [d, page, pages]);
  const filtered = q !== '' || sacId !== ALL || status !== ALL || categoryId !== ALL;

  const columns: Column<AdminBrandRow>[] = [
    {
      key: 'name', header: 'Brand', sort: r => r.name,
      cell: r => <div className="sl-table__primary">{r.name}</div>
    },
    { key: 'cats', header: 'Categories', cell: r => <CategoryChips paths={r.categoryPaths} max={3} /> },
    {
      key: 'companyName', header: 'Advertiser', sort: r => r.companyName,
      cell: r => <><div>{r.companyName}</div><div className="sl-table__secondary">{r.sacName}</div></>
    },
    {
      key: 'products', header: 'Products / variants', align: 'right', sort: r => r.products.length,
      cell: r => `${num(r.products.length)} / ${num(r.products.reduce((n, p) => n + p.variants.length, 0))}`
    },
    { key: 'status', header: 'Status', sort: r => r.status, cell: r => <StatusTag tone={APPROVAL_TONE[r.status] ?? 'default'}>{cap(r.status)}</StatusTag> },
    { key: 'requestedAt', header: 'Requested', sort: r => r.requestedAt, cell: r => date(r.requestedAt) },
    { key: 'reviewedAt', header: 'Reviewed', sort: r => r.reviewedAt ?? '', cell: r => date(r.reviewedAt) }
  ];

  return (
    <Page>
      <PageHeader eyebrow="Catalog" title="Brands" description="Every brand across all SACs, with its products, variants and category mappings. Approval stays with each SAC." />
      <Card flush>
        <FilterBar>
          <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Brand, product, advertiser or category" />
          <SelectFilter label="SAC" value={sacId} onChange={setSacId} options={(sacs.data ?? []).map(s => ({ value: s.id, label: s.name }))} allLabel="All SACs" />
          <SelectFilter label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} allLabel="All statuses" />
          <SelectFilter label="Category" value={categoryId} onChange={setCategoryId} options={topLevel} allLabel="All categories" />
        </FilterBar>
        {!d ? (list.isLoading ? <Loading rows={6} /> : <ErrorState error={list.error} onRetry={() => void list.refetch()} />) : (
          <>
            <div style={{ opacity: list.isFetching && list.isPlaceholderData ? 0.6 : 1 }}>
              <DataTable caption="Brands" rows={d.rows} columns={columns} rowKey={r => r.id} pageSize={PAGE_SIZE} onRowClick={r => setOpenId(r.id)} sort={sort} onSortChange={setSort}
                empty={filtered ? <EmptyState title="No brands match">Try a different search or filter.</EmptyState> : <EmptyState title="No brands yet">Brands appear here once advertisers request them.</EmptyState>} />
            </div>
            {d.total > PAGE_SIZE && (
              <div className="sl-table-foot">
                <span>{num((d.page - 1) * d.pageSize + 1)}–{num(Math.min(d.page * d.pageSize, d.total))} of {num(d.total)} brands</span>
                <Pagination totalPages={pages} currentPage={d.page} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
      {openId && <BrandSheet brandId={openId} onClose={() => setOpenId(null)} />}
    </Page>
  );
}
