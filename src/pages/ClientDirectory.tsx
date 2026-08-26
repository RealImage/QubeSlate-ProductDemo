import { clientsCat } from '../data/mockData';
import { PageHeader, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function ClientDirectory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
      <PageHeader title="Client Directory" description="Master advertiser and agency list with contact history." />
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Client</Th><Th>Type</Th><Th>Region</Th><Th>Primary contact</Th>
              <Th align="right">Campaigns</Th>
            </tr>
          </thead>
          <tbody>
            {clientsCat.map((c, i) => (
              <tr key={i}>
                <Td style={{ fontWeight: 500 }}>{c.name}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{c.type}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{c.region}</Td>
                <Td style={{ fontSize: 12.5, color: '#677A90' }}>{c.contact}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.campaigns}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
