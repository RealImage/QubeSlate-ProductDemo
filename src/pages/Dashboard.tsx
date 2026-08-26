import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { campaigns } from '../data/mockData';
import { getTheatres, money } from '../data/helpers';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Card, KpiGrid, PageHeader, StatusTag } from '../components/ui/primitives';

export function Dashboard() {
  const { navigateTo } = useAppState();

  const { netCap, netSold } = useMemo(() => {
    const theatres = getTheatres();
    const netCap = theatres.reduce((a, t) => a + t.screens.reduce((b, s) => b + s.cap, 0), 0);
    const netSold = theatres.reduce((a, t) => a + t.screens.reduce((b, s) => b + s.sold, 0), 0);
    return { netCap, netSold };
  }, []);

  const kpis = [
    { label: 'Active campaigns', value: '24', delta: '+12% vs last month', deltaColor: '#0F7B3F' },
    { label: 'Pending approvals', value: '8', delta: '3 urgent', deltaColor: '#E65C00' },
    { label: 'Booked this month', value: money(284000), delta: '+18% vs last month', deltaColor: '#0F7B3F' },
    { label: 'Bookable screens', value: '1,247', delta: '+5% network growth', deltaColor: '#0F7B3F' }
  ];

  const recentCampaigns = campaigns.slice(0, 4).map(c => ({ ...c, budgetLabel: money(c.budget) }));

  const inventoryMeters = [
    { label: 'Pre-show seconds sold', detail: `${Math.round(netSold / 60).toLocaleString('en-US')} of ${Math.round(netCap / 60).toLocaleString('en-US')} min`, pct: `${Math.round((netSold / netCap) * 100)}%`, color: '#084782' },
    { label: 'Intermission seconds sold', detail: '4,180 of 7,600 min', pct: '55%', color: '#6B3FA0' },
    { label: 'Screens with content delivered', detail: '1,193 of 1,247 screens', pct: '96%', color: '#0F7B3F' }
  ];

  const attention = [
    { title: '3 creatives missing content', detail: 'Placements are queued but cannot schedule', route: '/content/unmapped', color: '#CF1322' },
    { title: '8 campaigns pending approval', detail: '3 flights start within 5 days', route: '/approvals/campaigns', color: '#E65C00' },
    { title: '54 screens awaiting distribution', detail: 'Content in transit to theatre servers', route: '/reports/distribution', color: '#084782' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader
        title="Dashboard"
        description="Network-wide view of campaigns, inventory and playback for the current week."
        action={<Button variant="primary" size="medium" onClick={() => navigateTo('/campaigns/create')}>Create Campaign</Button>}
      />

      <KpiGrid items={kpis} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <Card padding={0} style={{ overflowX: 'auto', overflowY: 'hidden', flex: '1 1 560px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid #E1E4E9' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#08090A' }}>Recent Campaigns</h2>
            <button
              onClick={() => navigateTo('/campaigns')}
              style={{ border: '1px solid #E1E4E9', borderRadius: 6, background: '#FFFFFF', padding: '6px 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: '#084782', cursor: 'pointer' }}
            >
              View all
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Campaign', 'Client', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>{h}</th>
                ))}
                <th style={{ textAlign: 'right', padding: '9px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>Screens</th>
                <th style={{ textAlign: 'right', padding: '9px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '12px 20px', borderBottom: '1px solid #EDF0F3' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: '#677A90', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{c.id}</div>
                  </td>
                  <td style={{ padding: '12px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, color: '#4A5A6C' }}>{c.client}</td>
                  <td style={{ padding: '12px 20px', borderBottom: '1px solid #EDF0F3' }}><StatusTag tone={c.tone}>{c.status}</StatusTag></td>
                  <td style={{ padding: '12px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, color: '#08090A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.screens}</td>
                  <td style={{ padding: '12px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, fontWeight: 500, color: '#08090A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.budgetLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '1 1 300px', minWidth: 0 }}>
          <Card padding="18px 20px">
            <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Network inventory this week</h2>
            <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#677A90' }}>Pre-show seconds across all bookable screens.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {inventoryMeters.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 13, color: '#08090A', fontWeight: 500 }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: '#677A90', fontVariantNumeric: 'tabular-nums' }}>{m.detail}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 1000, background: '#EDF0F3', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: m.pct, background: m.color, borderRadius: 1000 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="18px 20px">
            <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Needs attention</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attention.map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigateTo(a.route)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 12px', border: '1px solid #E7EBF0', borderRadius: 6, background: '#FFFFFF', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 1000, background: a.color, flex: '0 0 auto' }} />
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#08090A' }}>{a.title}</span>
                    <span style={{ display: 'block', fontSize: 12, color: '#677A90', marginTop: 2 }}>{a.detail}</span>
                  </span>
                  <Icon name="ChevronRight" size={18} color="#97A5B5" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
