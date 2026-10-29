import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sacApi } from '@slate/api';
import { num } from '@slate/domain';
import { Card, DataTable, EmptyState, Input, Page, PageHeader, Query, StatCard, StatusTag } from '@slate/ui';

export function Theatres() {
  const q = useQuery({ queryKey: ['sac', 'theatres'], queryFn: sacApi.theatres });
  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter(t => !s || `${t.name} ${t.brand} ${t.city} ${t.state} ${t.exhibitorName} ${t.id}`.toLowerCase().includes(s));
  }, [q.data, search]);
  const screens = rows.reduce((n, t) => n + t.screens.length, 0);
  const seats = rows.reduce((n, t) => n + t.screens.reduce((m, s) => m + s.seats, 0), 0);

  return (
    <Page>
      <PageHeader title="Network Theatres & Screens" description="Theatres whose inventory you sell, with their screens and formats." />
      <div className="sl-grid sl-grid--3">
        <StatCard label="Theatres" value={num(rows.length)} />
        <StatCard label="Screens" value={num(screens)} />
        <StatCard label="Seats" value={num(seats)} />
      </div>
      <div style={{ maxWidth: 420 }}><Input label="Search" placeholder="Theatre, chain, city or exhibitor" value={search} onChange={setSearch} /></div>
      <Card flush>
        <Query q={q}>
          {() => (
            <DataTable
              rows={rows}
              rowKey={t => t.id}
              caption="Theatres"
              empty={<EmptyState title="No theatres match">{q.data?.length ? 'Try a different search.' : 'No exhibitors are linked to your SAC yet.'}</EmptyState>}
              columns={[
                { key: 'name', header: 'Theatre', sort: t => t.name, cell: t => <><div className="sl-table__primary">{t.name}</div><div className="sl-table__secondary">{t.city}, {t.state} · {t.id}</div></> },
                { key: 'exhibitor', header: 'Exhibitor', sort: t => t.exhibitorName, cell: t => <>{t.exhibitorName}<div className="sl-table__secondary">{t.brand}</div></> },
                { key: 'category', header: 'Category', sort: t => t.category, cell: t => t.category },
                { key: 'formats', header: 'Formats', cell: t => [...new Set(t.screens.map(s => s.format))].join(', ') },
                { key: 'screens', header: 'Screens', align: 'right', sort: t => t.screens.length, cell: t => t.screens.length },
                { key: 'seats', header: 'Seats', align: 'right', sort: t => t.screens.reduce((m, s) => m + s.seats, 0), cell: t => num(t.screens.reduce((m, s) => m + s.seats, 0)) },
                { key: 'dooh', header: 'DOOH', sort: t => t.doohStatus, cell: t => <StatusTag tone={t.doohStatus === 'Configured' ? 'positive' : 'default'}>{t.doohStatus}</StatusTag> }
              ]}
            />
          )}
        </Query>
      </Card>
    </Page>
  );
}
