import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, useSession } from '@slate/api';
import { ROLE_HINT, ROLE_LABEL, dateTime, type Role, type User } from '@slate/domain';
import { Alert, Button, Card, ConfirmDialog, DataTable, Dialog, EmptyState, Input, Page, PageHeader, Query, Select, StatusTag, toast } from '@slate/ui';
import { FormError, errorText } from '../shared';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES: Role[] = ['sac_admin', 'ad_ops', 'finance', 'viewer'];
const STATUS_TONE = { active: 'positive', invited: 'notice', disabled: 'negative' } as const;

function InviteForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('ad_ops');
  const invite = useMutation({
    mutationFn: () => usersApi.invite({ name: name.trim(), email: email.trim(), phone: phone.trim(), role: role as User['role'] }),
    onSuccess: u => {
      void qc.invalidateQueries({ queryKey: ['users'] });
      toast.add({ variant: 'positive', message: `Invited ${u.email}.` });
      onClose();
    }
  });
  const valid = !!name.trim() && EMAIL.test(email.trim());
  return (
    <>
      <Dialog.Header>Invite user</Dialog.Header>
      <Dialog.Body>
        <form id="invite-user" className="sl-stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); if (valid && !invite.isPending) invite.mutate(); }}>
          <Input label="Full name" value={name} onChange={setName} isRequired autoFocus />
          <Input label="Email" type="email" value={email} onChange={setEmail} isRequired errorMessage={email && !EMAIL.test(email.trim()) ? 'Enter a valid email address.' : undefined} />
          <Input label="Phone" type="tel" value={phone} onChange={setPhone} optional />
          <Select label="Role" selectedKey={role} onSelectionChange={k => setRole(k as Role)} description={ROLE_HINT[role]}>
            {ROLES.map(r => <Select.Option key={r} id={r}>{ROLE_LABEL[r]}</Select.Option>)}
          </Select>
          <FormError error={invite.error} />
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose} isDisabled={invite.isPending}>Cancel</Button>
        <Button variant="primary" type="submit" form="invite-user" isPending={invite.isPending} isDisabled={!valid}>Send invite</Button>
      </Dialog.Footer>
    </>
  );
}

export function UserManagement() {
  const qc = useQueryClient();
  const { session, can } = useSession();
  const manage = can('users.manage');
  const q = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<User | null>(null);

  const changeRole = useMutation({
    mutationFn: ({ u, role }: { u: User; role: Role }) => usersApi.update(u.id, { role: role as User['role'] }),
    onSuccess: u => { void qc.invalidateQueries({ queryKey: ['users'] }); toast.add({ variant: 'positive', message: `${u.name} is now ${ROLE_LABEL[u.role]}.` }); },
    onError: e => toast.add({ variant: 'negative', message: errorText(e) })
  });
  const remove = useMutation({
    mutationFn: (u: User) => usersApi.remove(u.id),
    onSuccess: (_, u) => { void qc.invalidateQueries({ queryKey: ['users'] }); setRemoving(null); toast.add({ variant: 'positive', message: `${u.name} removed.` }); }
  });

  return (
    <Page>
      <PageHeader title="User Management" description="People who can sign in to your SAC portal and what they can do."
        actions={manage && <Button variant="primary" onPress={() => setInviting(true)}>Invite user</Button>} />
      {!manage && <Alert variant="notice" closable={false} inline>Only SAC admins can invite, change or remove users.</Alert>}
      <Card flush>
        <Query q={q}>
          {users => (
            <DataTable
              rows={users}
              rowKey={u => u.id}
              caption="Users"
              empty={<EmptyState title="No users">Invite your first teammate.</EmptyState>}
              columns={[
                { key: 'name', header: 'User', sort: u => u.name, cell: u => <><div className="sl-table__primary">{u.name}{u.id === session?.user.id && <span className="sl-muted"> (you)</span>}</div><div className="sl-table__secondary">{u.email}</div></> },
                {
                  key: 'role', header: 'Role', sort: u => u.role, cell: u => manage && u.id !== session?.user.id ? (
                    <div style={{ width: 170 }}>
                      <Select aria-label={`Role for ${u.name}`} selectedKey={u.role} isDisabled={changeRole.isPending} onSelectionChange={k => k !== u.role && changeRole.mutate({ u, role: k as Role })}>
                        {ROLES.map(r => <Select.Option key={r} id={r}>{ROLE_LABEL[r]}</Select.Option>)}
                      </Select>
                    </div>
                  ) : ROLE_LABEL[u.role]
                },
                { key: 'status', header: 'Status', sort: u => u.status, cell: u => <StatusTag tone={STATUS_TONE[u.status]}>{u.status[0]!.toUpperCase() + u.status.slice(1)}</StatusTag> },
                { key: 'last', header: 'Last active', sort: u => u.lastActiveAt ?? '', cell: u => dateTime(u.lastActiveAt) },
                ...(manage ? [{ key: 'remove', header: <span className="sr-only">Remove</span>, align: 'right' as const, cell: (u: User) => u.id === session?.user.id ? null : <Button size="small" variant="default" onPress={() => { remove.reset(); setRemoving(u); }}>Remove</Button> }] : [])
              ]}
            />
          )}
        </Query>
      </Card>
      <Dialog isOpen={inviting} onOpenChange={setInviting} width={460}>{inviting && <InviteForm onClose={() => setInviting(false)} />}</Dialog>
      <ConfirmDialog open={!!removing} title={`Remove ${removing?.name ?? 'user'}?`} confirmLabel="Remove" tone="negative" busy={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing)} onCancel={() => setRemoving(null)}>
        They will lose access to the SAC portal immediately.
        {remove.error && <p role="alert" style={{ color: 'var(--text-negative)' }}>{errorText(remove.error)}</p>}
      </ConfirmDialog>
    </Page>
  );
}
