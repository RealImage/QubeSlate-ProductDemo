import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { num } from '@slate/domain';
import { Card, DataTable, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter, optionsOf } from '../../components/Filters';

export function TheatresPage() {
  const q = useQuery({ queryKey: ['admin', 'theatres'], queryFn: adminApi.theatres });
  const [exhibitor, setExhibitor] = useState(ALL);
  const [city, setCity] = useState('');
  const rows = useMemo(() => (q.data ?? []).filter(t =>
    (exhibitor === ALL || t.exhibitorName === exhibitor) && (!city.trim() || t.city.toLowerCase().includes(city.trim().toLowerCase()))
  ), [q.data, exhibitor, city]);
  return (
    <Page>
      <PageHeader eyebrow="Network" title="Theatres" description="Every exhibitor’s theatres, screens and DOOH configuration." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="Exhibitor" value={exhibitor} onChange={setExhibitor} options={optionsOf((q.data ?? []).map(t => t.exhibitorName))} allLabel="All exhibitors" />
          <SearchFilter label="City" value={city} onChange={setCity} placeholder="Search city" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Theatres" rows={rows} rowKey={t => t.id} defaultSort={{ key: 'name', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No theatres match</strong></div>}
              columns={[
                { key: 'name', header: 'Theatre', sort: t => t.name, cell: t => <><div className="sl-table__primary">{t.name}</div><div className="sl-table__secondary">{t.brand}</div></> },
                { key: 'ex', header: 'Exhibitor', sort: t => t.exhibitorName, cell: t => t.exhibitorName },
                { key: 'city', header: 'City', sort: t => t.city, cell: t => <>{t.city}<div className="sl-table__secondary">{t.state}</div></> },
                { key: 'screens', header: 'Screens', align: 'right', sort: t => t.screens.length, cell: t => num(t.screens.length) },
                { key: 'formats', header: 'Formats', cell: t => [...new Set(t.screens.map(s => s.format))].join(', ') },
                { key: 'dooh', header: 'DOOH', sort: t => t.doohStatus, cell: t => (
                  <StatusTag tone={t.doohStatus === 'Configured' ? 'positive' : 'notice'}>{t.doohStatus}{t.doohGroups.length ? ` · ${t.doohGroups.length} groups` : ''}</StatusTag>
                ) }
              ]} />
          )}
        </Query>
      </Card>
    </Page>
  );
}
