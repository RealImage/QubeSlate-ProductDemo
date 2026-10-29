import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Input, Tag } from '@slate/ui';

/** Single-select filter chips (status filters, type filters). */
export function FilterChips<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="sl-row" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" className="sl-chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}{o.count !== undefined && <span className="adv-chip-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Multi-select chips where the value is an id but the chip shows a label. */
export function IdChips({ options, value, onChange, label }: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  return (
    <div className="sl-row" role="group" aria-label={label}>
      {options.map(o => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" className="sl-chip" aria-pressed={on}
            onClick={() => onChange(on ? value.filter(x => x !== o.id) : [...value, o.id])}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Free-text chips: type and press Enter to add, remove with the tag's close button. */
export function TagInput({ label, value, onChange, placeholder, description }: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  description?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (t && !value.some(v => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div className="sl-stack" style={{ gap: 8 }}>
      <Input label={label} value={draft} onChange={setDraft} placeholder={placeholder} description={description}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      {value.length > 0 && (
        <div className="sl-row">
          {value.map(v => <Tag key={v} size="small" variant="primary-secondary" onClose={() => onChange(value.filter(x => x !== v))}>{v}</Tag>)}
        </div>
      )}
    </div>
  );
}

/** Labelled group for non-input controls (chips, choice cards) so they read like form fields. */
export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="adv-field" role="group" aria-label={label}>
      <span className="adv-field__label">{label}</span>
      {children}
      {error ? <span className="adv-field__error" role="alert">{error}</span> : hint && <span className="adv-field__hint">{hint}</span>}
    </div>
  );
}

/** Router link styled as a prefab button (navigation should be a link, not a button). */
export function ButtonLink({ to, variant = 'primary', size = 'medium', children, state }: {
  to: string;
  variant?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium';
  children: ReactNode;
  state?: unknown;
}) {
  return <Link to={to} state={state} className={`pf-button pf-button--${variant} pf-button--${size} adv-btnlink`}>{children}</Link>;
}
