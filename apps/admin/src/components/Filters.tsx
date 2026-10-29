import type { ReactNode } from 'react';
import { Input, Select } from '@slate/ui';

export const ALL = 'all';

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="sl-row" style={{ alignItems: 'flex-end', padding: '12px 16px', borderBottom: '1px solid var(--sl-border, #e5e9ef)' }}>{children}</div>;
}

export function SelectFilter({ label, value, onChange, options, allLabel = 'All' }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; allLabel?: string;
}) {
  return (
    <div style={{ minWidth: 200 }}>
      <Select label={label} selectedKey={value} onSelectionChange={k => onChange(k == null ? ALL : String(k))}>
        <Select.Option id={ALL} textValue={allLabel}>{allLabel}</Select.Option>
        {options.map(o => <Select.Option key={o.value} id={o.value} textValue={o.label}>{o.label}</Select.Option>)}
      </Select>
    </div>
  );
}

export function SearchFilter({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ minWidth: 220 }}>
      <Input label={label} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

/** Distinct sorted option list from a set of strings. */
export function optionsOf(values: string[]): { value: string; label: string }[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b)).map(v => ({ value: v, label: v }));
}
