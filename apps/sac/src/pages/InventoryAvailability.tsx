import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { theatreDefs } from '../data/mockData';
import { getTheatres, secs, fmtDate } from '../data/helpers';
import { Button } from '../components/Button';
import { Card, ChipRow, chipTone, PageHeader } from '../components/ui/primitives';

export function InventoryAvailability() {
  const { state, patch, navigateTo } = useAppState();
  const { invCircuit, invTheatre, screenSel, f } = state;
  const theatres = useMemo(() => getTheatres(), []);

  const circuits = useMemo(() => ['all', ...Array.from(new Set(theatreDefs.map(t => t.circuit)))], []);
  const circuitChips = circuits.map(v => ({ value: v, label: v === 'all' ? 'All circuits' : v, ...chipTone(invCircuit === v) }));

  const visibleTheatres = useMemo(() => theatres.filter(t => invCircuit === 'all' || t.circuit === invCircuit), [theatres, invCircuit]);

  const theatreList = useMemo(() => visibleTheatres.map(t => {
    const cap = t.screens.reduce((a, s) => a + s.cap, 0);
    const sold = t.screens.reduce((a, s) => a + s.sold, 0);
    const pct = Math.round((sold / cap) * 100);
    const sel = t.id === invTheatre;
    return {
      id: t.id, name: t.name, meta: `${t.circuit} · ${t.city} · ${t.screens.length} screens`,
      util: `${pct}% sold`, pct: `${pct}%`,
      utilColor: pct > 85 ? 'var(--text-negative)' : pct > 65 ? 'var(--orange-600)' : 'var(--text-positive-alt)',
      bg: sel ? 'var(--bg-surface)' : 'var(--surface-white)', bar: sel ? 'var(--fill-product)' : 'transparent',
      weight: sel ? 600 : 500
    };
  }), [visibleTheatres, invTheatre]);

  const detail = useMemo(() => theatres.find(t => t.id === invTheatre) || visibleTheatres[0] || theatres[0], [theatres, invTheatre, visibleTheatres]);
  const dCap = detail.screens.reduce((a, s) => a + s.cap, 0);
  const dSold = detail.screens.reduce((a, s) => a + s.sold, 0);

  const screenRows = useMemo(() => detail.screens.map(s => {
    const avail = s.cap - s.sold;
    const pct = Math.round((s.sold / s.cap) * 100);
    const checked = screenSel.indexOf(s.id) >= 0;
    return {
      id: s.id, name: s.name, seats: s.seats, format: s.format,
      shows: `${s.showCount} shows`,
      pct: `${pct}%`,
      barColor: pct > 85 ? 'var(--text-negative)' : pct > 65 ? 'var(--orange-600)' : 'var(--text-product)',
      capLabel: `${secs(s.sold)} of ${secs(s.cap)} sold · ${pct}%`,
      sold: `${s.sold.toLocaleString('en-US')}s`,
      available: `${avail.toLocaleString('en-US')}s`,
      availColor: avail < 600 ? 'var(--text-negative)' : 'var(--text-positive-alt)',
      checked, rowBg: checked ? 'var(--bg-surface)' : 'var(--text-white)'
    };
  }), [detail, screenSel]);

  const { selSeconds, selScreens } = useMemo(() => {
    let secsSum = 0, count = 0;
    theatres.forEach(t => t.screens.forEach(s => {
      if (screenSel.indexOf(s.id) >= 0) { secsSum += s.cap - s.sold; count++; }
    }));
    return { selSeconds: secsSum, selScreens: count };
  }, [theatres, screenSel]);

  const toggleScreen = (id: string) => patch(s => ({ screenSel: s.screenSel.indexOf(id) >= 0 ? s.screenSel.filter(x => x !== id) : s.screenSel.concat([id]) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1500 }}>
      <PageHeader title="Inventory Availability" description="Pre-show seconds sold and available, per screen and per show. Select screens to build a booking." />

      <Card padding="14px 16px" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--grey-600)' }}>Week of</span>
          <input type="date" value={f.invDate} onChange={e => patch(s => ({ f: { ...s.f, invDate: e.target.value } }))} style={{ height: 34, padding: '0 10px', border: '1px solid var(--border-default-subtle)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--text-default)', outline: 'none' }} />
        </label>
        <span style={{ width: 1, height: 24, background: 'var(--fill-default)' }} />
        <ChipRow chips={circuitChips} onSelect={v => patch({ invCircuit: v })} />
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{visibleTheatres.length} theatres · {visibleTheatres.reduce((a, t) => a + t.screens.length, 0)} screens bookable</span>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
        <Card padding={0} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default-alt)', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Theatres</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {theatreList.map(t => (
              <button
                key={t.id}
                onClick={() => patch({ invTheatre: t.id })}
                style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '13px 16px', border: 0, borderBottom: '1px solid var(--border-default-alt)', borderLeft: `3px solid ${t.bar}`, background: t.bg, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: t.weight, color: 'var(--text-default)' }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{t.util}</span>
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{t.meta}</span>
                <span style={{ display: 'block', height: 5, borderRadius: 1000, background: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: t.pct, background: t.utilColor, borderRadius: 1000 }} />
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <Card padding="20px 24px" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text-default)' }}>{detail.name}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{detail.circuit} · {detail.city} · {detail.screens.length} screens · week of {fmtDate(f.invDate)}</p>
            </div>
            <div style={{ display: 'flex', gap: 28 }}>
              {[
                { label: 'Capacity', value: `${Math.round(dCap / 60).toLocaleString('en-US')} min`, color: 'var(--text-default)' },
                { label: 'Sold', value: `${Math.round(dSold / 60).toLocaleString('en-US')} min`, color: 'var(--text-product)' },
                { label: 'Available', value: `${Math.round((dCap - dSold) / 60).toLocaleString('en-US')} min`, color: 'var(--text-positive-alt)' }
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 600, color: s.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={0} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 44, padding: '10px 0 10px 20px', borderBottom: '2px solid var(--border-default-alt)' }}></th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-default-alt)' }}>Screen</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-default-alt)' }}>Shows / day</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-default-alt)', minWidth: 200 }}>Pre-show capacity</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-default-alt)' }}>Sold</th>
                  <th style={{ textAlign: 'right', padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-default-alt)' }}>Available</th>
                </tr>
              </thead>
              <tbody>
                {screenRows.map(s => (
                  <tr key={s.id} style={{ background: s.rowBg }}>
                    <td style={{ padding: '12px 0 12px 20px', borderBottom: '1px solid var(--border-default-alt)' }}>
                      <input type="checkbox" checked={s.checked} onChange={() => toggleScreen(s.id)} style={{ width: 16, height: 16, accentColor: 'var(--fill-product)', cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default-alt)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{s.seats} seats · {s.format}</div>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default-alt)', fontSize: 12.5, color: 'var(--grey-600)', whiteSpace: 'nowrap' }}>{s.shows}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default-alt)' }}>
                      <div style={{ display: 'flex', height: 10, borderRadius: 1000, background: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: s.pct, background: s.barColor }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{s.capLabel}</div>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default-alt)', fontSize: 13.5, color: 'var(--text-default)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.sold}</td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-default-alt)', fontSize: 13.5, fontWeight: 600, color: s.availColor, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--wire-50)', borderRadius: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-product)' }}>Selection</span>
              <span style={{ fontSize: 13.5, color: 'var(--text-default)' }}>{selScreens} screens selected across the network</span>
            </div>
            <div style={{ flex: '1 1 auto' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right' }}>
              <span style={{ fontSize: 11.5, color: 'var(--grey-600)' }}>Available seconds in selection</span>
              <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-product)', fontVariantNumeric: 'tabular-nums' }}>{selSeconds.toLocaleString('en-US')}s</span>
            </div>
            <Button variant="primary" size="medium" onClick={() => navigateTo('/campaigns/create')}>Book selection</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
