import { useEffect, useId, useState, type ReactNode } from 'react';
import { Button, Checkbox, Input, Sheet, TableControls } from 'prefab';
import { CancelIcon, FilterAdjustIcon } from 'prefab/icons';

/**
 * The one filter surface for list pages, after cinemas-db: a Filters button opens a right-hand panel; edits there are a
 * draft until "Apply filters". "Clear all" resets and applies at once. Applied filters show on the page as capsules.
 *
 *   const [open, setOpen] = useState(false);
 *   const [draft, setDraft] = useFilterDraft(filters, open);
 *   <FilterButton count={n} onPress={() => setOpen(true)} />
 *   <FilterPanel isOpen={open} onOpenChange={setOpen} onApply={() => setFilters(draft)} onClear={() => setFilters(empty)}>
 *     <FilterGroup title="Status">…controls bound to draft…</FilterGroup>
 *   </FilterPanel>
 */

/** Toolbar trigger for the filter panel, with the number of applied filters. */
export function FilterButton({ count = 0, onPress }: { count?: number; onPress: () => void }) {
  return (
    <Button variant="default" onPress={onPress} aria-label={count ? `Filters, ${count} applied` : 'Filters'}>
      <FilterAdjustIcon />
      Filters
      {count > 0 && <span className="sl-filterbtn__count" aria-hidden="true">{count}</span>}
    </Button>
  );
}

export function FilterPanel({ isOpen, onOpenChange, title = 'Filters', onApply, onClear, children }: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Commit the draft; the panel closes afterwards. */
  onApply: () => void;
  /** Reset to no filters, applied immediately; the panel stays open. */
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet isOpen={isOpen} onOpenChange={onOpenChange} size={360}>
      <Sheet.Header>{title}</Sheet.Header>
      <Sheet.Body><div className="sl-filterpanel">{children}</div></Sheet.Body>
      <Sheet.Footer>
        <div className="sl-filterpanel__foot">
          <Button variant="link" onPress={onClear}>Clear all</Button>
          <Button variant="primary" onPress={() => { onApply(); onOpenChange(false); }}>Apply filters</Button>
        </div>
      </Sheet.Footer>
    </Sheet>
  );
}

/** A titled group inside the panel; the title names the group for assistive tech. */
export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="sl-filtergroup">
      <span id={id} className="sl-filtergroup__title">{title}</span>
      {children}
    </div>
  );
}

/**
 * Checkbox list for one multi-select filter. Long lists (over 8 options) get a search box.
 * `options` are values; `labelOf` turns one into display text.
 */
export function FilterOptions<T extends string>({ options, selected, onChange, labelOf = v => v }: {
  options: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
  labelOf?: (v: T) => string;
}) {
  const [term, setTerm] = useState('');
  const t = term.trim().toLowerCase();
  const shown = t ? options.filter(o => labelOf(o).toLowerCase().includes(t)) : options;
  return (
    <>
      {options.length > 8 && <Input aria-label="Search options" placeholder="Search options" value={term} onChange={setTerm} />}
      <div className="sl-filteroptions">
        {shown.map(o => (
          <Checkbox key={o} isSelected={selected.includes(o)} onChange={on => onChange(on ? [...selected, o] : selected.filter(x => x !== o))}>
            {labelOf(o)}
          </Checkbox>
        ))}
        {shown.length === 0 && <p className="sl-muted sl-small" style={{ margin: 0 }}>No matches</p>}
      </div>
    </>
  );
}

/**
 * Draft copy of the applied filters, re-synced each time the panel opens so edits abandoned by closing without
 * "Apply filters" are discarded.
 */
export function useFilterDraft<T>(applied: T, open: boolean) {
  const [draft, setDraft] = useState<T>(applied);
  // Only re-sync on open: `applied` changing while the panel is open would clobber edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setDraft(applied); }, [open]);
  return [draft, setDraft] as const;
}

export interface AppliedFilter { key: string; label: string; value: string; onRemove: () => void }

/** Capsules for the filters in force, each removable, plus a Clear all. Renders nothing when none apply. */
export function AppliedFilters({ filters, onClearAll }: { filters: AppliedFilter[]; onClearAll: () => void }) {
  if (!filters.length) return null;
  return (
    <div className="sl-applied" aria-label="Applied filters" role="group">
      {filters.map(f => (
        <span key={f.key} className="sl-applied__chip">
          <span><span className="sl-applied__label">{f.label}:</span> {f.value}</span>
          <button type="button" aria-label={`Remove ${f.label}: ${f.value}`} onClick={f.onRemove}><CancelIcon aria-hidden="true" /></button>
        </span>
      ))}
      <Button variant="link" size="small" onPress={onClearAll}>Clear all</Button>
    </div>
  );
}

export const PAGE_SIZES = [100, 200, 500] as const;

/** Current page slice for `rows`, clamped so shrinking results never leave the user on an empty page. */
export function usePage<T>(rows: readonly T[], pageSize: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return { totalPages, current, start, slice: rows.slice(start, start + pageSize) };
}

/** Table footer: "Showing 1–100 of 2,412", rows-per-page (100 / 200 / 500) and page links. */
export function ListFooter({ total, page, pageSize, onPageChange, onPageSizeChange, noun = 'results' }: {
  total: number; page: number; pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  noun?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const fmt = (n: number) => n.toLocaleString('en-IN');
  return (
    <TableControls slot="footer" className="sl-listfoot">
      <TableControls.Row>
        <TableControls.Caption>Showing {fmt(from)}–{fmt(to)} of {fmt(total)} {noun}</TableControls.Caption>
        <TableControls.Section align="end">
          <TableControls.PageSizeSelector label="Rows per page" options={[...PAGE_SIZES]} value={pageSize} onChange={v => onPageSizeChange(Number(v))} />
          {totalPages > 1 && <TableControls.Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />}
        </TableControls.Section>
      </TableControls.Row>
    </TableControls>
  );
}
