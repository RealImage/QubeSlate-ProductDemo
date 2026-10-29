import { dateTime, ROLE_LABEL, type Sac } from '@slate/domain';
import { Card, DataTable, Query, StatusTag } from '@slate/ui';
import { useAdminUsers } from '../../components/queries';

export function SacUsersCard({ sac }: { sac: Sac }) {
  const q = useAdminUsers();
  return (
    <Card title="SAC users" flush>
      <Query q={q}>
        {users => (
          <DataTable caption="SAC users" rows={users.filter(u => u.orgId === sac.id)} rowKey={u => u.id}
            empty={<div className="sl-empty"><strong>No users for this SAC</strong></div>}
            columns={[
              { key: 'name', header: 'User', sort: u => u.name, cell: u => <><div className="sl-table__primary">{u.name}</div><div className="sl-table__secondary">{u.email}</div></> },
              { key: 'role', header: 'Role', sort: u => u.role, cell: u => ROLE_LABEL[u.role] },
              { key: 'status', header: 'Status', cell: u => <StatusTag tone={u.status === 'active' ? 'positive' : u.status === 'invited' ? 'notice' : 'secondary'}>{u.status}</StatusTag> },
              { key: 'last', header: 'Last active', sort: u => u.lastActiveAt ?? '', cell: u => dateTime(u.lastActiveAt) }
            ]} />
        )}
      </Query>
    </Card>
  );
}
