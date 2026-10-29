import { Fragment, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Tag, Button } from 'prefab';
import { ApiError } from '@slate/api';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="sl-pagehead">
      <div className="sl-pagehead__text">
        {eyebrow && <p className="sl-eyebrow">{eyebrow}</p>}
        <h1 className="sl-title">{title}</h1>
        {description && <p className="sl-subtitle">{description}</p>}
      </div>
      {actions && <div className="sl-pagehead__actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, description, actions, footer, children, flush, className }: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode; footer?: ReactNode; children?: ReactNode; flush?: boolean; className?: string;
}) {
  return (
    <section className={'sl-card ' + (className ?? '')}>
      {(title || actions) && (
        <div className="sl-card__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {flush ? children : <div className="sl-card__body">{children}</div>}
      {footer && <div className="sl-card__foot">{footer}</div>}
    </section>
  );
}

export function StatCard({ label, value, hint, tone }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: 'positive' | 'notice' | 'negative' }) {
  return (
    <div className="sl-card sl-stat">
      <div className="sl-stat__label">{label}</div>
      <div className="sl-stat__value">{value}</div>
      {hint && <div className="sl-stat__hint" style={tone ? { color: `var(--text-${tone === 'positive' ? 'positive-alt' : tone})` } : undefined}>{hint}</div>}
    </div>
  );
}

type Tone = 'positive' | 'notice' | 'negative' | 'primary-secondary' | 'secondary' | 'default' | 'primary';
export function StatusTag({ tone, children, size = 'small' }: { tone: Tone; children: ReactNode; size?: 'xsmall' | 'small' | 'medium' }) {
  return <Tag variant={tone} size={size}>{children}</Tag>;
}

/** `label` names what is progressing for screen readers, e.g. "Plays delivered". */
export function Progress({ value, tone, label }: { value: number; tone?: 'positive' | 'notice' | 'negative'; label: string }) {
  const color = tone ? `var(--fill-${tone})` : undefined;
  return <div className="sl-progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
  </div>;
}

export function KeyValue({ items }: { items: [ReactNode, ReactNode][] }) {
  return <dl className="sl-kv">{items.map(([k, v], i) => <Fragment key={i}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>;
}

export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return <div className="sl-empty"><strong>{title}</strong>{children && <div>{children}</div>}{action}</div>;
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return <div className="sl-stack" style={{ padding: 20 }} aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => <div key={i} className="sl-skeleton" style={{ width: `${90 - i * 12}%` }} />)}
  </div>;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong.';
  return <EmptyState title="Couldn’t load this" action={onRetry && <Button variant="default" size="small" onPress={onRetry}>Try again</Button>}>{message}</EmptyState>;
}

/** Renders loading / error / content for a React Query result. */
export function Query<T>({ q, children, rows }: { q: { data: T | undefined; isLoading: boolean; error: unknown; refetch: () => unknown }; children: (data: T) => ReactNode; rows?: number }) {
  if (q.isLoading) return <Loading rows={rows} />;
  if (q.error || q.data === undefined) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return <>{children(q.data)}</>;
}

export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return <ul className="sl-checklist">{items.map(i => <li key={i.label} className={i.done ? 'is-done' : ''}><i aria-hidden />{i.label}<span className="sr-only">{i.done ? ' (done)' : ' (to do)'}</span></li>)}</ul>;
}

export function ChoiceCards<T extends string>({ options, value, onChange, label }: {
  options: { value: T; title: string; hint?: string; disabled?: boolean }[]; value: T | null; onChange: (v: T) => void; label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter(i => i >= 0);
  // Roving tab stop: the selected option, or the first enabled one when nothing is selected.
  const tabStop = options.findIndex(o => o.value === value && !o.disabled);
  const focusable = tabStop >= 0 ? tabStop : enabled[0];
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step || !enabled.length) return;
    e.preventDefault();
    const pos = enabled.indexOf(i);
    const next = enabled[(pos + step + enabled.length) % enabled.length]!;
    refs.current[next]?.focus();
    onChange(options[next]!.value);
  };
  return (
    <div className="sl-choices" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button key={o.value} ref={el => { refs.current[i] = el; }} type="button" role="radio" className="sl-choice"
          aria-checked={value === o.value} aria-disabled={o.disabled || undefined} tabIndex={i === focusable ? 0 : -1}
          style={o.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          onClick={() => !o.disabled && onChange(o.value)} onKeyDown={e => onKeyDown(e, i)}>
          <strong>{o.title}</strong>{o.hint && <span>{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

export function ChipToggle({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div className="sl-row" role="group" aria-label={label}>
      {options.map(o => {
        const on = value.includes(o);
        return <button key={o} type="button" className="sl-chip" aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])}>{o}</button>;
      })}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');
  return <span className="sl-avatar" aria-hidden>{ini}</span>;
}
