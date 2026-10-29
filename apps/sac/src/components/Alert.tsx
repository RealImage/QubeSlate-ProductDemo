import type { ReactNode } from 'react';

export type AlertTone = 'primary' | 'positive' | 'negative' | 'notice';

interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
}

/** Thin wrapper around the `pf-alert` / `pf-alert--{tone}` classes from prefab.css. */
export function Alert({ tone = 'primary', children }: AlertProps) {
  return (
    <div className={`pf-alert pf-alert--${tone}`}>
      <div className="pf-alert__content">{children}</div>
    </div>
  );
}
