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
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                </Td>
                <Td style={{ fontSize: 13, color: 'var(--grey-600)' }}>{u.role}</Td>
                <Td style={{ fontSize: 13, color: 'var(--grey-600)' }}>{u.scope}</Td>
                <Td><StatusTag tone={u.tone}>{u.state}</StatusTag></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
