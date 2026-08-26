import { useMemo } from 'react';
import { campaigns } from '../data/mockData';
import { getTheatres, money } from '../data/helpers';
import { Card, PageHeader } from '../components/ui/primitives';

const WEEKS = [
  { label: 'Week of 3 Aug', plays: 18420 }, { label: 'Week of 10 Aug', plays: 21160 },
  { label: 'Week of 17 Aug', plays: 24880 }, { label: 'Week of 24 Aug', plays: 23140 },
  { label: 'Week of 31 Aug', plays: 27600 }, { label: 'Week of 7 Sep', plays: 31240 }
];

export function ReportsAnalytics() {
  const circuitUtil = useMemo(() => {
    const theatres = getTheatres();
    const acc: { circuit: string; cap: number; sold: number }[] = [];
    theatres.forEach(t => {
      const cap = t.screens.reduce((a, s) => a + s.cap, 0);
      const sold = t.screens.reduce((a, s) => a + s.sold, 0);
      const row = acc.find(r => r.circuit === t.circuit);
      if (row) { row.cap += cap; row.sold += sold; } else acc.push({ circuit: t.circuit, cap, sold });
    });
    return acc.map(r => {
      const pct = Math.round((r.sold / r.cap) * 100);
      return { label: r.circuit, pct: `${pct}%`, value: `${pct}% sold`, color: pct > 85 ? '#CF1322' : pct > 65 ? '#E65C00' : '#084782' };
    });
  }, []);

  const maxPlays = Math.max(...WEEKS.map(w => w.plays));
  const weekBars = WEEKS.map(w => ({ label: w.label, value: w.plays.toLocaleString('en-US'), height: `${Math.round((w.plays / maxPlays) * 100)}%` }));

  const topCampaigns = campaigns.slice().sort((a, b) => b.budget - a.budget).slice(0, 5).map(c => ({
    name: c.name, client: c.client, budget: money(c.budget),
    pct: `${Math.round((c.budget / 61500) * 100)}%`
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1300 }}>
      <PageHeader title="Reports & Analytics" description="Inventory utilisation, delivered plays and campaign value across the network." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 16, alignItems: 'start' }}>
        <Card padding="20px 24px">
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Utilisation by circuit</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {circuitUtil.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#08090A', fontWeight: 500 }}>{c.label}</span>
                  <span style={{ fontSize: 12.5, color: '#677A90', fontVariantNumeric: 'tabular-nums' }}>{c.value}</span>
                </div>
                <div style={{ height: 8, borderRadius: 1000, background: '#EDF0F3', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: c.pct, background: c.color, borderRadius: 1000 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="20px 24px">
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Delivered plays per week</h3>
          <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#677A90' }}>Proof-of-play confirmed across all screens.</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            {weekBars.map((w, i) => (
              <div key={i} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11.5, color: '#4A5A6C', fontVariantNumeric: 'tabular-nums' }}>{w.value}</span>
                <div style={{ width: '100%', height: w.height, background: '#084782', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                <span style={{ fontSize: 10.5, color: '#97A5B5', textAlign: 'center', lineHeight: 1.3 }}>{w.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Top campaigns by booked value</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topCampaigns.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ width: 210, flex: '0 0 auto', fontSize: 13.5, fontWeight: 500, color: '#08090A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              <span style={{ width: 170, flex: '0 0 auto', fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.client}</span>
              <span style={{ flex: '1 1 auto', height: 22, borderRadius: 4, background: '#EDF0F3', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: c.pct, background: '#084782', borderRadius: 4 }} />
              </span>
              <span style={{ width: 84, flex: '0 0 auto', textAlign: 'right', fontSize: 13.5, fontWeight: 600, color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{c.budget}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
