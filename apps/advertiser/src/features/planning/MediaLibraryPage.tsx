import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi } from '@slate/api';
import {
  Alert, Button, Card, ConfirmDialog, DataTable, EmptyState, Input, KeyValue, Page, PageHeader, Query, Select, Sheet, StatusTag, Tag, type Column
} from '@slate/ui';
import { AddIcon, DeleteIcon, SearchIcon } from 'prefab/icons';
import { bytes, dateTime, duration, type Brand, type Media } from '@slate/domain';
import { errorText, notifySuccess, qk, useOrg } from '../../components/org';
import { ButtonLink, FilterChips } from '../../components/controls';

export const MEDIA_STATUS: Record<Media['status'], { label: string; tone: 'notice' | 'positive' | 'negative' }> = {
  processing: { label: 'Processing', tone: 'notice' },
  ready: { label: 'Ready', tone: 'positive' },
  rejected: { label: 'Rejected', tone: 'negative' }
};

type TypeFilter = 'all' | Media['fileType'];
type StatusFilter = 'all' | Media['status'];

export function MediaLibraryPage() {
  const { can } = useOrg();
  const q = useQuery({
    queryKey: qk.media, queryFn: advertiserApi.media,
    // Uploads are ingested asynchronously; poll while anything is still processing.
    refetchInterval: query => (query.state.data?.some(m => m.status === 'processing') ? 5000 : false)
  });
  const brands = useQuery({ queryKey: qk.brands, queryFn: advertiserApi.brands });
  return (
    <Page>
      <PageHeader title="Media Library" description="Every asset in your account. Where and when they play is set on placements, not here."
        actions={can('media.edit') && <ButtonLink to="/media/new"><AddIcon width={16} height={16} />Upload media</ButtonLink>} />
      <Card flush>
        <Query q={q}>{media => <MediaTable media={media} brands={brands.data ?? []} />}</Query>
      </Card>
    </Page>
  );
}

function MediaTable({ media, brands }: { media: Media[]; brands: Brand[] }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [brandId, setBrandId] = useState<string>('all');
  // Track the id, not the row: the list polls while uploads process, and the drawer must show the latest copy.
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? media.find(m => m.id === openId) ?? null : null;
  const brandName = (id: string) => brands.find(b => b.id === id)?.name ?? '—';

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return media.filter(m =>
      (type === 'all' || m.fileType === type) &&
      (status === 'all' || m.status === status) &&
      (brandId === 'all' || m.brandId === brandId) &&
      (!s || [m.name, m.fileName, brands.find(b => b.id === m.brandId)?.name ?? ''].some(x => x.toLowerCase().includes(s))));
  }, [media, brands, search, type, status, brandId]);
  const filtered = type !== 'all' || status !== 'all' || brandId !== 'all' || !!search.trim();
  const usedBrands = brands.filter(b => media.some(m => m.brandId === b.id));

  const columns: Column<Media>[] = [
    {
      key: 'name', header: 'Name & size', sort: m => m.name, cell: m => (
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="sl-table__primary">{m.name}</span>
          <span className="sl-table__secondary">{bytes(m.sizeBytes)} · {m.fileName}</span>
        </span>
      )
    },
    { key: 'brand', header: 'Brand', sort: m => brandName(m.brandId), cell: m => brandName(m.brandId) },
    { key: 'type', header: 'Type · Duration', sort: m => m.fileType, cell: m => `${m.fileType} · ${m.fileType === 'Image' ? 'Still' : duration(m.durationSecs)}` },
    { key: 'status', header: 'Status', sort: m => m.status, cell: m => <StatusTag tone={MEDIA_STATUS[m.status].tone}>{MEDIA_STATUS[m.status].label}</StatusTag> },
    { key: 'languages', header: 'Languages', cell: m => m.languages.join(', ') || '—' },
    {
      key: 'attrs', header: 'Attributes', cell: m => m.fileType === 'CPL'
        ? <span className="sl-row" style={{ gap: 4 }}>{m.attributes.map(a => <Tag key={a} size="xsmall" variant="secondary">{a}</Tag>)}</span>
        : m.orientation ?? '—'
    },
    { key: 'created', header: 'Created on', sort: m => m.createdAt, cell: m => dateTime(m.createdAt) },
    { key: 'by', header: 'Created by', sort: m => m.createdBy, cell: m => m.createdBy }
  ];

  return (
    <>
      <div className="adv-toolbar">
        <div className="adv-toolbar__search">
          <Input aria-label="Search media" placeholder="Search media by name, brand or file" value={search} onChange={setSearch} prefix={<SearchIcon width={16} height={16} />} />
        </div>
        <FilterChips label="File type" value={type} onChange={setType} options={[
          { value: 'all', label: 'All types' }, { value: 'CPL', label: 'CPL' }, { value: 'Video', label: 'Video' }, { value: 'Image', label: 'Image' }
        ]} />
        <FilterChips label="Status" value={status} onChange={setStatus} options={[
          { value: 'all', label: 'Any status' }, { value: 'ready', label: 'Ready' }, { value: 'processing', label: 'Processing' }, { value: 'rejected', label: 'Rejected' }
        ]} />
        <div style={{ width: 180 }}>
          <Select aria-label="Brand" value={brandId} onChange={k => setBrandId(String(k ?? 'all'))}>
            {[{ id: 'all', name: 'All brands' }, ...usedBrands].map(b => <Select.Option key={b.id} id={b.id}>{b.name}</Select.Option>)}
          </Select>
        </div>
        <div className="adv-toolbar__spacer" />
        {filtered && <Button size="small" variant="link" onPress={() => { setSearch(''); setType('all'); setStatus('all'); setBrandId('all'); }}>Clear all</Button>}
        <span className="sl-muted sl-small">{shown.length} of {media.length}</span>
      </div>
      <DataTable rows={shown} columns={columns} rowKey={m => m.id} pageSize={10} onRowClick={m => setOpenId(m.id)} defaultSort={{ key: 'created', dir: 'desc' }} caption="Media"
        empty={<EmptyState title={media.length ? 'No media matches' : 'No media yet'}>
          {media.length ? 'Try a different search term or clear the filters.' : 'Upload a CPL for cinema or a video/image for DOOH.'}
        </EmptyState>} />
      {open && <MediaSheet media={open} brand={brandName(open.brandId)} onClose={() => setOpenId(null)} />}
    </>
  );
}

function MediaSheet({ media: m, brand, onClose }: { media: Media; brand: string; onClose: () => void }) {
  const { can } = useOrg();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const del = useMutation({
    mutationFn: () => advertiserApi.deleteMedia(m.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.media }); notifySuccess(`${m.name} deleted.`); onClose(); }
  });
  return (
    <Sheet isOpen onOpenChange={o => !o && onClose()} size={460}>
      <Sheet.Header>{m.name}</Sheet.Header>
      <Sheet.Body>
        <div className="sl-stack">
          <div className="sl-row"><StatusTag tone={MEDIA_STATUS[m.status].tone}>{MEDIA_STATUS[m.status].label}</StatusTag><span className="sl-muted sl-small">{m.id}</span></div>
          {m.status === 'rejected' && m.rejectionReason && <Alert variant="negative" closable={false} title="Rejected">{m.rejectionReason}</Alert>}
          {m.status === 'processing' && <Alert variant="notice" closable={false} inline>Ingest and validation in progress. It can be attached to campaigns meanwhile.</Alert>}
          <KeyValue items={[
            ['Brand', brand],
            ['File type', m.fileType],
            ['File', <span className="sl-mono" style={{ wordBreak: 'break-all' }}>{m.fileName}</span>],
            ['Size', bytes(m.sizeBytes)],
            ['Duration', m.fileType === 'Image' ? 'Still image' : duration(m.durationSecs)],
            ['Languages', m.languages.join(', ') || '—'],
            ...(m.fileType === 'CPL' ? [
              ['Attributes', m.attributes.join(', ') || '—'],
              ['Censor certificate', m.censorCertificate ? `${m.censorCertificate.number} · ${m.censorCertificate.rating}` : '—'],
              ['Certificate file', m.censorCertificate?.fileName ?? '—']
            ] as [string, string][] : [['Orientation', m.orientation ?? '—'] as [string, string]]),
            ['Created', `${dateTime(m.createdAt)} by ${m.createdBy}`]
          ]} />
          {del.error && <Alert variant="negative" closable={false}>{errorText(del.error)}</Alert>}
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        {can('media.edit') && <Button variant="negative" onPress={() => setConfirm(true)}><DeleteIcon width={16} height={16} />Delete</Button>}
        <Button variant="default" onPress={onClose}>Close</Button>
      </Sheet.Footer>
      <ConfirmDialog open={confirm} title={`Delete ${m.name}?`} tone="negative" confirmLabel="Delete media" busy={del.isPending}
        onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); del.mutate(); }}>
        Media used by placements can’t be deleted. This can’t be undone.
      </ConfirmDialog>
    </Sheet>
  );
}
