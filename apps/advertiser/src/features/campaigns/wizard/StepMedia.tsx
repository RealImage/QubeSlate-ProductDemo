import type { UseQueryResult } from '@tanstack/react-query';
import { Button, Card, EmptyState, Query, StatusTag } from '@slate/ui';
import { UploadIcon } from 'prefab/icons';
import { duration, type Media } from '@slate/domain';
import { MEDIA_STATUS } from '../../planning/MediaLibraryPage';
import type { WizardForm } from './CampaignWizard';

/** Step 3: attach media from the library — the campaign brand's Ready or Processing assets that fit the channels. */
export function StepMedia({ form, update, media, brandName, fits, onUploadNew }: {
  form: WizardForm;
  update: (p: Partial<WizardForm>) => void;
  media: UseQueryResult<Media[]>;
  brandName: string;
  fits: (m: Media) => boolean;
  onUploadNew: () => void;
}) {
  const toggle = (id: string) => update({ mediaIds: form.mediaIds.includes(id) ? form.mediaIds.filter(x => x !== id) : [...form.mediaIds, id] });
  const kinds = [form.channels.includes('cinema') && 'CPL', form.channels.includes('dooh') && 'video or image'].filter(Boolean).join(' and ');
  return (
    <Card title="Media" description={`${brandName || 'Brand'} media that is Ready or Processing. This campaign accepts ${kinds || 'no'} media.`}
      actions={<Button size="small" variant="secondary" onPress={onUploadNew}><UploadIcon width={16} height={16} />Upload new</Button>}>
      <Query q={media}>
        {list => {
          const eligible = list.filter(m => m.brandId === form.brandId && m.status !== 'rejected' && fits(m));
          if (!eligible.length) {
            return <EmptyState title="Nothing eligible yet">Upload {kinds} media for {brandName || 'this brand'} — the draft is saved first.</EmptyState>;
          }
          return (
            <div className="sl-stack" style={{ gap: 8 }} role="group" aria-label="Media">
              {eligible.map(m => {
                const on = form.mediaIds.includes(m.id);
                return (
                  <button key={m.id} type="button" className="adv-pick" aria-pressed={on} onClick={() => toggle(m.id)}>
                    <span className="adv-pick__check" aria-hidden>{on ? '✓' : ''}</span>
                    <span className="adv-list__main">
                      <span className="sl-table__primary">{m.name}</span>
                      <span className="sl-table__secondary">
                        {m.fileType} · {m.fileType === 'Image' ? 'Still' : duration(m.durationSecs)}
                        {m.fileType === 'CPL' ? ` · ${m.attributes.join(', ')}` : m.orientation ? ` · ${m.orientation}` : ''}
                      </span>
                    </span>
                    <StatusTag tone={MEDIA_STATUS[m.status].tone}>{MEDIA_STATUS[m.status].label}</StatusTag>
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
