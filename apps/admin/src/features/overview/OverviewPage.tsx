import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '@slate/api';
import { inrShort, num } from '@slate/domain';
import { Page, PageHeader, Query, StatCard } from '@slate/ui';
import { NeedsAttention } from './NeedsAttention';

export function OverviewPage() {
  const q = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview });
  return (
    <Page>
      <PageHeader eyebrow="Qube" title="Overview" description="Platform-wide tenants, inventory and device health." />
      <Query q={q} rows={3}>
        {o => {
          const bad = o.devicesOffline + o.devicesStale;
          return (
            <div className="sl-grid sl-grid--4">
              <StatCard label="Exhibitors" value={num(o.exhibitors)} />
              <StatCard label="SACs" value={num(o.sacs)} />
              <StatCard label="Theatres" value={num(o.theatres)} hint={`${num(o.screens)} screens · ${num(o.doohGroups)} DOOH groups`} />
              <StatCard label="Advertisers" value={num(o.advertisers)} />
              <StatCard label="Live campaigns" value={num(o.campaignsLive)} />
              <StatCard label="Booked value" value={inrShort(o.bookedValue)} />
              <StatCard label="Devices offline" value={num(o.devicesOffline)} tone={o.devicesOffline ? 'negative' : 'positive'}
                hint={<Link to="/network/devices">View devices</Link>} />
              <StatCard label="Devices stale" value={num(o.devicesStale)} tone={o.devicesStale ? 'notice' : 'positive'}
                hint={<Link to="/network/ingestion">{bad ? 'Network health' : 'All devices healthy'}</Link>} />
            </div>
          );
        }}
      </Query>
      <NeedsAttention />
    </Page>
  );
}
