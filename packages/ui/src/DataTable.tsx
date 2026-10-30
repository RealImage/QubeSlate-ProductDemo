import { useMemo, useState, type ReactNode } from 'react';
import { Pagination } from 'prefab';
import { SortAscendingIcon, SortDescendingIcon, SortIcon } from 'prefab/icons';
import { EmptyState } from './components';

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [role="checkbox"], [role="menuitem"]';

/** Row clicks ignore events that started on a control inside the row (a cell action, link or input). */
function fromInnerControl(e: { target: EventTarget; currentTarget: EventTarget }) {
  const el = e.target as Element;
  const hit = el.closest?.(INTERACTIVE);
  return !!hit && hit !== e.currentTarget && (e.currentTarget as Element).contains(hit);
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Value to sort by. Omit to make the column unsortable. */
  sort?: (row: T) => string | number;
  align?: 'left' | 'right';
  width?: number | string;
}

/** Sortable, paginated table. Horizontal scroll stays inside the card; the footer stays put. */
export type SortState = { key: string; dir: 'asc' | 'desc' };

export function DataTable<T>({ rows, columns, rowKey, onRowClick, pageSize = 25, defaultSort, sort: sortProp, onSortChange, empty, caption }: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  defaultSort?: SortState;
  /** Server-sorted tables: pass the current sort and handle changes; rows are shown in the order given. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  empty?: ReactNode;
  caption?: string;
}) {
  const [localSort, setLocalSort] = useState<SortState | null>(defaultSort ?? null);
  const controlled = onSortChange !== undefined;
  const sort = controlled ? sortProp ?? null : localSort;
  const setSort = controlled ? onSortChange : setLocalSort;
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => {
    if (controlled) return rows;
    const col = sort && columns.find(c => c.key === sort.key);
    if (!col?.sort) return rows;
    const get = col.sort;
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort!.dir === 'asc' ? r : -r;
    });
  }, [rows, columns, sort, controlled]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * pageSize, current * pageSize);

  if (!rows.length) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return (
    <>
      <div className="sl-table-wrap">
        <table className="sl-table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map(c => {
                const active = sort?.key === c.key;
                const Icon = !active ? SortIcon : sort!.dir === 'asc' ? SortAscendingIcon : SortDescendingIcon;
                return (
                  <th key={c.key} className={c.align === 'right' ? 'num' : undefined} style={{ width: c.width }} aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {c.sort ? (
                      <button type="button" onClick={() => setSort(active && sort!.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' })}>
                        {c.header}<Icon width={14} height={14} aria-hidden />
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={rowKey(r)} className={onRowClick ? 'is-clickable' : undefined} onClick={onRowClick ? e => { if (!fromInnerControl(e)) onRowClick(r); } : undefined}
                tabIndex={onRowClick ? 0 : undefined} onKeyDown={onRowClick ? e => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(r); } : undefined}>
                {columns.map(c => <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="sl-table-foot">
          <span>{(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}</span>
          <Pagination totalPages={pages} currentPage={current} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}
