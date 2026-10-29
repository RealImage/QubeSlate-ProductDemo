export interface Step {
  title: string;
  hint?: string;
  done?: boolean;
  disabled?: boolean;
}

/** Wizard rail: numbered steps with a sub-label, matching the advertiser campaign wizard. */
export function Stepper({ steps, current, onSelect }: { steps: Step[]; current: number; onSelect?: (i: number) => void }) {
  return (
    <nav className="sl-steps" aria-label="Progress">
      {steps.map((s, i) => (
        <button key={s.title} type="button" className={'sl-step' + (s.done ? ' is-done' : '')}
          aria-current={i === current ? 'step' : undefined} aria-disabled={s.disabled || undefined}
          onClick={() => !s.disabled && onSelect?.(i)}>
          <span className="sl-step__n">{i + 1}</span>
          <span className="sl-step__label"><strong>{s.title}</strong>{s.hint && <span>{s.hint}</span>}</span>
        </button>
      ))}
    </nav>
  );
}
