import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@slate/api';
import {
  Alert, Avatar, Button, Card, ChoiceCards, ConfirmDialog, DataTable, Dialog, Input, Page, PageHeader, Query, Select, StatusTag, type Column
} from '@slate/ui';
import { AddIcon, DeleteIcon } from 'prefab/icons';
import { dateTime, ROLE_HINT, ROLE_LABEL, type AdvertiserRole, type User } from '@slate/domain';
import { errorText, notifyError, notifySuccess, qk, useOrg } from '../../components/org';
import { Field } from '../../components/controls';

const ROLES: AdvertiserRole[] = ['admin', 'planner', 'viewer'];
const STATUS_TONE: Record<User['status'], 'positive' | 'notice' | 'secondary'> = { active: 'positive', invited: 'notice', disabled: 'secondary' };
const STATUS_LABEL: Record<User['status'], string> = { active: 'Active', invited: 'Invited', disabled: 'Disabled' };

export function UsersPage() {
  const { company, user: me, can } = useOrg();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.users, queryFn: usersApi.list });
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<User | null>(null);
  const manage = can('users.manage');

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdvertiserRole }) => usersApi.update(id, { role }),
    onSuccess: u => { qc.invalidateQueries({ queryKey: qk.users }); notifySuccess(`${u.name} is now ${ROLE_LABEL[u.role]}.`); },
    onError: notifyError
  });
  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.users }); notifySuccess(`${removing?.name ?? 'User'} removed.`); setRemoving(null); },
    onError: notifyError
  });

  const columns: Column<User>[] = [
    {
      key: 'name', header: 'Name', sort: u => u.name, cell: u => (
        <span className="sl-row" style={{ flexWrap: 'nowrap' }}>
          <Avatar name={u.name} />
          <span className="sl-table__primary">{u.name}{u.id === me.id && <span className="sl-muted"> (you)</span>}</span>
        </span>
      )
    },
    { key: 'email', header: 'Email', sort: u => u.email, cell: u => u.email },
    {
      key: 'role', header: 'Role', sort: u => u.role, width: 180, cell: u => manage && u.id !== me.id ? (
        <Select aria-label={`Role for ${u.name}`} value={u.role} isDisabled={changeRole.isPending}
          onChange={k => { if (k && k !== u.role) changeRole.mutate({ id: u.id, role: k as AdvertiserRole }); }}>
          {ROLES.map(r => <Select.Option key={r} id={r}>{ROLE_LABEL[r]}</Select.Option>)}
        </Select>
      ) : ROLE_LABEL[u.role]
    },
    { key: 'status', header: 'Status', sort: u => u.status, cell: u => <StatusTag tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</StatusTag> },
    { key: 'last', header: 'Last active', sort: u => u.lastActiveAt ?? '', cell: u => dateTime(u.lastActiveAt) },
    ...(manage ? [{
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, cell: (u: User) => u.id === me.id ? null : (
        <Button size="small" variant="secondary" iconOnly aria-label={`Remove ${u.name}`} onPress={() => setRemoving(u)}><DeleteIcon width={18} height={18} /></Button>
      )
    }] : [])
  ];

  return (
    <Page>
      <PageHeader title="Users & Roles" description={`Everyone who can act on behalf of ${company.name}. Campaigns and media belong to the company, not the user.`}
        actions={manage && <Button variant="primary" onPress={() => setInviting(true)}><AddIcon width={16} height={16} />Invite user</Button>} />
      {!manage && <Alert variant="primary" closable={false}>Only company admins can invite users or change roles.</Alert>}
      <div className="sl-grid sl-grid--3">
        {ROLES.map(r => (
          <Card key={r}><strong>{ROLE_LABEL[r]}</strong><p className="sl-muted sl-small" style={{ margin: '4px 0 0' }}>{ROLE_HINT[r]}</p></Card>
        ))}
      </div>
      <Card flush>
        <Query q={q}>{users => <DataTable rows={users} columns={columns} rowKey={u => u.id} defaultSort={{ key: 'name', dir: 'asc' }} caption="Users" />}</Query>
      </Card>
      {inviting && <InviteDialog onClose={() => setInviting(false)} />}
      <ConfirmDialog open={!!removing} title={`Remove ${removing?.name ?? 'user'}?`} confirmLabel="Remove user" tone="negative" busy={remove.isPending}
        onCancel={() => setRemoving(null)} onConfirm={() => removing && remove.mutate(removing.id)}>
        They lose access to {company.name} immediately. Campaigns, media and target groups they created stay with the company.
      </ConfirmDialog>
    </Page>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', email: '', phone: '', role: 'planner' as AdvertiserRole });
  const [touched, setTouched] = useState(false);
  const errors = {
    name: !f.name.trim() ? 'Name is required.' : undefined,
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? 'Enter a valid work email.' : undefined
  };
  const invite = useMutation({
    mutationFn: () => usersApi.invite({ ...f, name: f.name.trim(), email: f.email.trim() }),
    onSuccess: u => { qc.invalidateQueries({ queryKey: qk.users }); notifySuccess(`Invite sent to ${u.email}.`); onClose(); }
  });
  const submit = () => { setTouched(true); if (!errors.name && !errors.email) invite.mutate(); };
  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={520}>
      <Dialog.Header>Invite user</Dialog.Header>
      <Dialog.Body>
        <form id="invite-form" className="sl-stack" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
          <Input label="Full name" value={f.name} onChange={v => setF({ ...f, name: v })} errorMessage={touched ? errors.name : undefined} isRequired />
          <Input label="Work email" type="email" value={f.email} onChange={v => setF({ ...f, email: v })} errorMessage={touched ? errors.email : undefined} isRequired />
          <Input label="Phone" type="tel" prefix="+91" value={f.phone} onChange={v => setF({ ...f, phone: v })} optional />
          <Field label="Role">
            <ChoiceCards label="Role" value={f.role} onChange={role => setF({ ...f, role })}
              options={ROLES.map(r => ({ value: r, title: ROLE_LABEL[r], hint: ROLE_HINT[r] }))} />
          </Field>
          {invite.error && <Alert variant="negative" closable={false}>{errorText(invite.error)}</Alert>}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="invite-form" isPending={invite.isPending}>Send invite</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
