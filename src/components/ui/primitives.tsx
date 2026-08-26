import type { CSSProperties, ReactNode, TdHTMLAttributes } from 'react';
import { Tag, type TagSize, type TagTone } from '../Tag';

/**
 * Shared style building blocks translated 1:1 from the inline `style="…"`
 * strings repeated throughout `project/Qube Slate.dc.html` — every card,
 * table and chip in that file uses the same handful of declarations, so
 * they're centralised here instead of re-typed on every page.
 */

export const cardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E1E4E9', borderRadius: 8,
  boxShadow: '0 1px 2px rgba(4,38,82,.06)'
};

export function Card({ children, style, padding = '20px 24px' }: { children: ReactNode; style?: CSSProperties; padding?: string | number }) {
  return <div style={{ ...cardStyle, padding, ...style }}>{children}</div>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em', color: '#08090A' }}>{title}</h1>
        {description ? <p style={{ margin: '5px 0 0', fontSize: 14, color: '#677A90' }}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function KpiGrid({ items, minWidth = 200 }: { items: { label: string; value: string; delta?: string; deltaColor?: string; color?: string }[]; minWidth?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`, gap: 16 }}>
      {items.map((k, i) => (
        <Card key={i} padding="18px 20px" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, color: '#677A90', fontWeight: 500 }}>{k.label}</span>
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: k.color || '#08090A', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
          {k.delta ? <span style={{ fontSize: 12, color: k.deltaColor || '#677A90', fontWeight: 500 }}>{k.delta}</span> : null}
        </Card>
      ))}
    </div>
  );
}

export interface Chip { value: string; label: string; bg: string; color: string; border: string }

export function chipTone(active: boolean): { bg: string; color: string; border: string } {
  return active
    ? { bg: '#084782', color: '#FFFFFF', border: '#084782' }
    : { bg: '#FFFFFF', color: '#4A5A6C', border: '#D3DAE2' };
}

export function ChipRow({ chips, onSelect }: { chips: Chip[]; onSelect: (value: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {chips.map(s => (
        <button
          key={s.value}
          onClick={() => onSelect(s.value)}
          style={{ padding: '7px 12px', border: `1px solid ${s.border}`, borderRadius: 1000, background: s.bg, color: s.color, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder: string; style?: CSSProperties }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ flex: '1 1 260px', minWidth: 220, height: 36, padding: '0 12px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13.5, color: '#08090A', outline: 'none', ...style }}
    />
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <Card padding="14px 16px" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{children}</Card>;
}

export function CountLabel({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12.5, color: '#677A90', marginLeft: 'auto' }}>{children}</span>;
}

/* ---------- table ---------- */

const thStyle: CSSProperties = { textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' };
const tdStyle: CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, color: '#08090A' };

export function TableCard({ children }: { children: ReactNode }) {
  return <Card padding={0} style={{ overflowX: 'auto', overflowY: 'hidden' }}>{children}</Card>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
}

export function Th({ children, align = 'left', style }: { children?: ReactNode; align?: 'left' | 'right'; style?: CSSProperties }) {
  return <th style={{ ...thStyle, textAlign: align, ...style }}>{children}</th>;
}

export function Td({ children, align = 'left', style, ...rest }: { children?: ReactNode; align?: 'left' | 'right'; style?: CSSProperties } & Omit<TdHTMLAttributes<HTMLTableCellElement>, 'style' | 'align'>) {
  return <td style={{ ...tdStyle, textAlign: align, ...style }} {...rest}>{children}</td>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#08090A' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#677A90', marginTop: 4 }}>{detail}</div>
    </div>
  );
}

export function StatusTag({ tone, size = 'small', children }: { tone: TagTone | string; size?: TagSize; children: ReactNode }) {
  return <Tag tone={tone} size={size}>{children}</Tag>;
}

export function ProgressBar({ pct, color, height = 8 }: { pct: string; color: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: 1000, background: '#EDF0F3', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct, background: color, borderRadius: 1000 }} />
    </div>
  );
}

/** Centered overlay dialog — translated from the `position: fixed; inset: 0` modal
 * markup repeated for the Network DOOH group editor / delete / discard-changes dialogs. */
export function Modal({ children, maxWidth = 440 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,38,82,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth, maxHeight: '100%', overflowY: 'auto', background: '#FFFFFF', borderRadius: 8, boxShadow: '0 18px 44px rgba(4,38,82,.24)' }}>
        {children}
      </div>
    </div>
  );
}
