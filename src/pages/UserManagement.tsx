import { users } from '../data/mockData';
import { PageHeader, StatusTag, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function UserManagement() {
  const rows = users.map(u => ({ ...u, tone: u.state === 'Active' ? 'positive' : 'negative' }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
      <PageHeader title="User Management" description="Users, roles, permissions and access levels." />
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>User</Th><Th>Role</Th><Th>Scope</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={i}>
                <Td>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#677A90' }}>{u.email}</div>
                </Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{u.role}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{u.scope}</Td>
                <Td><StatusTag tone={u.tone}>{u.state}</StatusTag></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
