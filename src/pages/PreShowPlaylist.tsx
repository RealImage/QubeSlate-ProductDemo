import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { playlistItems } from '../data/mockData';
import { getTheatres, secs } from '../data/helpers';
import { Card, PageHeader, StatusTag } from '../components/ui/primitives';

const SHOWTIMES = ['17:00', '19:45', '22:15'];

export function PreShowPlaylist() {
  const { state, patch } = useAppState();
  const plShow = state.plShow || 'TH-101-S1|19:45';

  const theatres = useMemo(() => getTheatres(), []);
  const plOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    theatres.forEach(t => t.screens.slice(0, 2).forEach(s => {
      SHOWTIMES.forEach(sh => opts.push({ value: `${t.id}|${s.id}|${sh}`, label: `${t.name} · ${s.name} · ${sh}` }));
    }));
    return opts;
  }, [theatres]);

  const preTotal = useMemo(() => playlistItems.filter(i => i.seg === 'Pre-show').reduce((a, i) => a + i.sec, 0), []);
  const intTotal = useMemo(() => playlistItems.filter(i => i.seg === 'Intermission').reduce((a, i) => a + i.sec, 0), []);
  const adSeconds = useMemo(() => playlistItems.filter(i => i.type === 'Ad' || i.type === 'Ad pod').reduce((a, i) => a + i.sec, 0), []);

  const plRows = useMemo(() => {
    const segTotals: Record<string, number> = { 'Pre-show': preTotal, 'Intermission': intTotal };
    return playlistItems.map((i, idx) => {
      const denom = segTotals[i.seg] || 1;
      return {
        idx: idx + 1, seg: i.seg, name: i.name, type: i.type, pos: i.pos,
        len: secs(i.sec),
        width: `${Math.max(2, Math.round((i.sec / denom) * 100))}%`,
        color: i.type === 'Ad' || i.type === 'Ad pod' ? '#084782' : i.type === 'Trailer' ? '#6B3FA0' : '#97A5B5',
        tone: i.type === 'Ad' || i.type === 'Ad pod' ? 'primary-secondary' : i.type === 'Trailer' ? 'violet' : 'default'
      };
    });
  }, [preTotal, intTotal]);

  const preRows = plRows.filter(r => r.seg === 'Pre-show');
  const intRows = plRows.filter(r => r.seg === 'Intermission');

  const Segment = ({ title, rows }: { title: string; rows: typeof plRows }) => (
    <Card padding="20px 24px">
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>{title}</h3>
      <div style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', border: '1px solid #E1E4E9', marginBottom: 18 }}>
        {rows.map((r, i) => (
          <div key={i} title={r.name} style={{ width: r.width, background: r.color, borderRight: '1px solid rgba(255,255,255,.5)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(r => (
          <div key={r.idx} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: '1px solid #EDF0F3' }}>
            <span style={{ width: 22, fontSize: 12, color: '#97A5B5', fontVariantNumeric: 'tabular-nums' }}>{r.idx}</span>
            <span style={{ width: 4, height: 22, borderRadius: 1000, background: r.color, flex: '0 0 auto' }} />
            <span style={{ flex: '1 1 auto', fontSize: 13.5, color: '#08090A', fontWeight: 500 }}>{r.name}</span>
            <StatusTag tone={r.tone}>{r.type}</StatusTag>
            <span style={{ width: 70, textAlign: 'center', fontSize: 12.5, color: '#677A90' }}>Pos {r.pos}</span>
            <span style={{ width: 56, textAlign: 'right', fontSize: 13, color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{r.len}</span>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1300 }}>
      <PageHeader title="Pre-Show Playlist" description="The exact sequence around a show — the difference between what should play and in what order." />

      <Card padding="14px 16px" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 420px' }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: '#4A5A6C', whiteSpace: 'nowrap' }}>Show</span>
          <select value={plShow} onChange={e => patch({ plShow: e.target.value })} style={{ flex: '1 1 auto', height: 36, padding: '0 10px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: '#08090A', background: '#FFFFFF', outline: 'none' }}>
            {plOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 22, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Pre-show</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#084782', fontVariantNumeric: 'tabular-nums' }}>{secs(preTotal)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Intermission</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#6B3FA0', fontVariantNumeric: 'tabular-nums' }}>{secs(intTotal)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Saleable</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{adSeconds}s</span>
          </div>
        </div>
      </Card>

      <Segment title="Pre-show segment" rows={preRows} />
      <Segment title="Intermission segment" rows={intRows} />
    </div>
  );
}
