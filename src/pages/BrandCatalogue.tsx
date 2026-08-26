import { brandsCat } from '../data/mockData';
import { PageHeader, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function BrandCatalogue() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
      <PageHeader title="Brand Catalogue" description="Master brand list with linked creatives and metadata." />
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Brand</Th><Th>Category</Th><Th>Client</Th>
              <Th align="right">Creatives</Th><Th align="right">Campaigns</Th>
            </tr>
          </thead>
          <tbody>
            {brandsCat.map((b, i) => (
              <tr key={i}>
                <Td style={{ fontWeight: 500 }}>{b.name}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{b.category}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{b.client}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.creatives}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.campaigns}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
