import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { playlistItems } from '../data/mockData';
import { secs } from '../data/helpers';
import { Card, PageHeader } from '../components/ui/primitives';

const TEMPLATES = [
  { name: 'Metro Prime — Pre-show', segments: 'Policy · 4 ad positions · 2 trailers · ident', slots: '5 ad slots · 180s saleable', theatres: 42 },
  { name: 'Tier 2 Standard — Pre-show', segments: 'Policy · 3 ad positions · 1 trailer', slots: '3 ad slots · 120s saleable', theatres: 78 },
  { name: 'Premium Large Format', segments: 'Policy · 5 ad positions · 3 trailers · ident', slots: '5 ad slots · 240s saleable', theatres: 28 },
  { name: 'Intermission Premium', segments: '2 ad positions · next-week promo', slots: '2 ad slots · 90s saleable', theatres: 61 }
];

export function PlaylistTemplates() {
  const { state, patch } = useAppState();
  const bPre = state.bPre != null ? state.bPre : 720;
  const bInt = state.bInt != null ? state.bInt : 240;

  const preTotal = useMemo(() => playlistItems.filter(i => i.seg === 'Pre-show').reduce((a, i) => a + i.sec, 0), []);
  const intTotal = useMemo(() => playlistItems.filter(i => i.seg === 'Intermission').reduce((a, i) => a + i.sec, 0), []);
  const preOver = preTotal > bPre, intOver = intTotal > bInt;
  const prePct = `${Math.min(100, Math.round((preTotal / bPre) * 100))}%`;
  const intPct = `${Math.min(100, Math.round((intTotal / bInt) * 100))}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1300 }}>
      <PageHeader title="Playlist Templates" description="Ad block layouts, and the theatre-level boundaries that cap how much content each segment can hold." />

      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Playlist boundaries</h3>
        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#677A90' }}>Maximum durations enforced at the theatre. Content beyond the boundary is dropped by priority.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#08090A' }}>Max pre-show duration</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={bPre} onChange={e => patch({ bPre: Number(e.target.value) || 0 })} style={{ width: 92, height: 34, padding: '0 10px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: '#08090A', textAlign: 'right', outline: 'none' }} />
                <span style={{ fontSize: 12.5, color: '#677A90' }}>seconds</span>
              </span>
            </label>
            <div style={{ height: 10, borderRadius: 1000, background: '#EDF0F3', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: prePct, background: preOver ? '#CF1322' : '#084782', borderRadius: 1000 }} />
            </div>
            <span style={{ fontSize: 12, color: '#677A90', fontVariantNumeric: 'tabular-nums' }}>{secs(preTotal)} of {secs(bPre)} allocated</span>
            {preOver && (
              <div style={{ padding: '10px 12px', border: '1px solid #F0C4C7', borderRadius: 6, background: '#FDF2F2', fontSize: 12.5, color: '#CF1322', lineHeight: 1.5 }}>
                Pre-show exceeds the theatre boundary by {secs(preTotal - bPre)}. Lowest-priority ad positions will be dropped at the theatre.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#08090A' }}>Max intermission duration</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={bInt} onChange={e => patch({ bInt: Number(e.target.value) || 0 })} style={{ width: 92, height: 34, padding: '0 10px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: '#08090A', textAlign: 'right', outline: 'none' }} />
                <span style={{ fontSize: 12.5, color: '#677A90' }}>seconds</span>
              </span>
            </label>
            <div style={{ height: 10, borderRadius: 1000, background: '#EDF0F3', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: intPct, background: intOver ? '#CF1322' : '#6B3FA0', borderRadius: 1000 }} />
            </div>
            <span style={{ fontSize: 12, color: '#677A90', fontVariantNumeric: 'tabular-nums' }}>{secs(intTotal)} of {secs(bInt)} allocated</span>
            {intOver && (
              <div style={{ padding: '10px 12px', border: '1px solid #F0C4C7', borderRadius: 6, background: '#FDF2F2', fontSize: 12.5, color: '#CF1322', lineHeight: 1.5 }}>
                Intermission exceeds the boundary by {secs(intTotal - bInt)}.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        {TEMPLATES.map(t => (
          <Card key={t.name} padding="18px 20px" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#08090A' }}>{t.name}</span>
              <span style={{ fontSize: 12, color: '#677A90' }}>{t.theatres} theatres</span>
            </div>
            <span style={{ fontSize: 12.5, color: '#4A5A6C' }}>{t.segments}</span>
            <span className="pf-tag pf-tag--primary-secondary pf-tag--small" style={{ alignSelf: 'flex-start' }}><span className="pf-tag__content">{t.slots}</span></span>
          </Card>
        ))}
      </div>
    </div>
  );
}
