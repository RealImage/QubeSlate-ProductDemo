import type { CSSProperties, ReactNode } from 'react';

export type TagSize = 'xsmall' | 'small' | 'medium' | 'large';
export type TagTone = 'default' | 'primary' | 'primary-secondary' | 'secondary' | 'positive' | 'negative' | 'notice' | 'orange' | 'violet' | 'invert';

interface TagProps {
  /** Loosely typed to `string` because upstream mock data (e.g. `Campaign.tone`)
   * carries plain-string tones; `TagTone` documents the known `pf-tag--*` suffixes. */
  tone?: TagTone | string;
  size?: TagSize;
  children: ReactNode;
  style?: CSSProperties;
}

/** Thin wrapper around the `pf-tag` / `pf-tag--{tone}` classes from prefab.css. */
export function Tag({ tone = 'default', size = 'small', children, style }: TagProps) {
  return (
    <span className={`pf-tag pf-tag--${tone} pf-tag--${size}`} style={style}>
      <span className="pf-tag__content">{children}</span>
    </span>
  );
}
