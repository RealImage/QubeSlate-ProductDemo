import type { UseQueryResult } from '@tanstack/react-query';
import type { TargetGroupWithReach } from '@slate/api';
import { Button, Card, EmptyState, Query, StatusTag } from '@slate/ui';
import { AddIcon } from 'prefab/icons';
import { num } from '@slate/domain';
import type { WizardForm } from './CampaignWizard';

/** Step 2: attach one or more reusable target groups. Placements pick from these. */
export function StepTargets({ form, update, targetGroups, onCreateNew }: {
  form: WizardForm;
  update: (p: Partial<WizardForm>) => void;
  targetGroups: UseQueryResult<TargetGroupWithReach[]>;
  onCreateNew: () => void;
}) {
  const toggle = (id: string) => update({
    targetGroupIds: form.targetGroupIds.includes(id) ? form.targetGroupIds.filter(x => x !== id) : [...form.targetGroupIds, id]
  });
  return (
    <Card title="Target groups" description="Attach one or more. Placements pick from these."
      actions={<Button size="small" variant="secondary" onPress={onCreateNew}><AddIcon width={16} height={16} />Create new</Button>}>
      <Query q={targetGroups}>
        {list => {
          const eligible = list.filter(t => form.channels.includes(t.channel));
          if (!eligible.length) {
            return <EmptyState title="No target groups for these channels">Create one — the draft is saved first, and you can come back to it from Campaign Management.</EmptyState>;
          }
          return (
            <div className="sl-stack" style={{ gap: 8 }} role="group" aria-label="Target groups">
              {eligible.map(t => {
                const on = form.targetGroupIds.includes(t.id);
                return (
                  <button key={t.id} type="button" className="adv-pick" aria-pressed={on} onClick={() => toggle(t.id)}>
                    <span className="adv-pick__check" aria-hidden>{on ? '✓' : ''}</span>
                    <span className="adv-list__main">
                      <span className="sl-table__primary">{t.name}</span>
                      <span className="sl-table__secondary">{t.summary}</span>
                    </span>
                    {form.channels.length > 1 && <StatusTag tone="secondary">{t.channel === 'cinema' ? 'Cinema' : 'DOOH'}</StatusTag>}
                    <span className="sl-small sl-muted" style={{ whiteSpace: 'nowrap' }}>
                      {num(t.reach.units)} {t.channel === 'cinema' ? 'screens' : 'displays'} · {t.reach.theatres} cinemas
                    </span>
                  </button>
                );
              })}
            </div>
          );
        }}
      </Query>
    </Card>
  );
}
