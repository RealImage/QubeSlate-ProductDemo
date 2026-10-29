/** Section switcher rendered as a labelled group of toggle buttons (each a normal Tab stop, state via aria-pressed). */
export function SectionTabs<T extends string>({ tabs, value, onChange, label }: { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="sl-row" role="group" aria-label={label}>
      {tabs.map(t => (
        <button key={t.value} type="button" className="sl-chip" aria-pressed={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
