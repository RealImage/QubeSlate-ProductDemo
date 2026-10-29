import type { KeyboardEvent, ReactNode } from 'react';

/**
 * Underlined tab strip for switching between sections of one page (WAI-ARIA tabs pattern).
 * Use this for sections; pills (`sl-chip`) are for filters only.
 * `name` scopes the element ids so a page can hold more than one tab set; pass the same
 * `name` to each `TabPanel`. Panels are rendered by the caller.
 */
export function Tabs<T extends string>({ name, tabs, value, onChange, label }: {
  name: string;
  tabs: { id: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const tabId = (id: string) => `${name}-tab-${id}`;
  const onKeyDown = (e: KeyboardEvent) => {
    const i = tabs.findIndex(t => t.id === value);
    const target =
      e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length]
        : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length]
          : e.key === 'Home' ? tabs[0]
            : e.key === 'End' ? tabs[tabs.length - 1]
              : undefined;
    if (!target) return;
    e.preventDefault();
    onChange(target.id);
    document.getElementById(tabId(target.id))?.focus();
  };
  return (
    <div className="sl-tabs" role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button key={t.id} type="button" role="tab" id={tabId(t.id)} className="sl-tab"
          aria-selected={value === t.id} aria-controls={`${name}-panel-${t.id}`} tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={onKeyDown}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ of, id, children }: { of: string; id: string; children: ReactNode }) {
  return <div role="tabpanel" id={`${of}-panel-${id}`} aria-labelledby={`${of}-tab-${id}`} tabIndex={0} className="sl-tabpanel">{children}</div>;
}
