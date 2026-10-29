import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type MediaInput } from '@slate/api';
import {
  Alert, Button, Card, ChipToggle, ChoiceCards, EmptyState, FileDropzone, Input, Page, PageHeader, Query, Select
} from '@slate/ui';
import { UploadIcon } from 'prefab/icons';
import { bytes, CPL_ATTRIBUTES, type Brand, type CplAttribute, type Media } from '@slate/domain';
import { errorText, notifySuccess, qk, useOrg } from '../../components/org';
import { Field } from '../../components/controls';
import { LANGUAGES } from './options';

type Rating = NonNullable<Media['censorCertificate']>['rating'];

const ACCEPT: Record<Media['fileType'], string[] | undefined> = {
  CPL: undefined, // DCP packages are folders of MXF/XML; don't restrict by MIME.
  Video: ['video/mp4', 'video/quicktime', 'video/webm'],
  Image: ['image/png', 'image/jpeg', 'image/webp']
};

export function CreateMediaPage() {
  const { can } = useOrg();
  const brands = useQuery({ queryKey: qk.brands, queryFn: advertiserApi.brands });
  return (
    <Page>
      <p className="sl-eyebrow"><Link to="/media">Media Library</Link> / Create media</p>
      <PageHeader title="Create Media" description="Upload a creative once; placements decide where and when it plays." />
      {!can('media.edit')
        ? <Card><EmptyState title="You can’t upload media">Your role is read-only. Ask a company admin or planner.</EmptyState></Card>
        : <Query q={brands}>{list => <MediaForm brands={list.filter(b => b.status === 'approved')} />}</Query>}
    </Page>
  );
}

function MediaForm({ brands }: { brands: Brand[] }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState<string | null>(brands.length === 1 ? brands[0]!.id : null);
  const [fileType, setFileType] = useState<Media['fileType']>('CPL');
  const [file, setFile] = useState<File | null>(null);
  const [secs, setSecs] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certNumber, setCertNumber] = useState('');
  const [rating, setRating] = useState<Rating>('UA');
  const [attributes, setAttributes] = useState<CplAttribute[]>([]);
  const [orientation, setOrientation] = useState<'Horizontal' | 'Vertical' | null>(null);
  const [touched, setTouched] = useState(false);

  const isCpl = fileType === 'CPL';
  const durationSecs = Number(secs);
  const errors = {
    name: !name.trim() ? 'Media name is required.' : undefined,
    brand: !brandId ? 'Pick an approved brand.' : undefined,
    file: !file ? 'Attach the media file.' : undefined,
    duration: fileType !== 'Image' && !(Number.isInteger(durationSecs) && durationSecs > 0) ? 'Enter the duration in whole seconds.' : undefined,
    cert: isCpl && !certFile ? 'A censor certificate is required for CPLs.' : undefined,
    certNumber: isCpl && !certNumber.trim() ? 'Enter the certificate number.' : undefined,
    orientation: !isCpl && !orientation ? 'Pick an orientation.' : undefined
  };
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);
  const valid = Object.values(errors).every(e => !e);

  const create = useMutation({
    mutationFn: (input: MediaInput) => advertiserApi.createMedia(input),
    onSuccess: m => {
      qc.invalidateQueries({ queryKey: qk.media });
      notifySuccess(`${m.name} uploaded — processing. It appears in the library as Ready once validated.`);
      navigate('/media');
    }
  });

  const submit = () => {
    setTouched(true);
    if (!valid || !file || !brandId) return;
    create.mutate({
      name: name.trim(), brandId, fileType, fileName: file.name, sizeBytes: file.size,
      durationSecs: fileType === 'Image' ? 0 : durationSecs,
      languages,
      censorCertificate: isCpl && certFile ? { fileName: certFile.name, number: certNumber.trim(), rating } : null,
      attributes: isCpl ? attributes : [],
      orientation: isCpl ? null : orientation
    });
  };

  if (!brands.length) {
    return (
      <Card><EmptyState title="No approved brands yet" action={<Link to="/company/brands">Request a brand</Link>}>
        Media belongs to a brand. Once your sales house approves one, you can upload media for it.
      </EmptyState></Card>
    );
  }

  return (
    <div className="sl-grid sl-grid--aside">
      <Card title="Media details">
        <form id="media-form" className="adv-form" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="adv-span"><Input label="Media name" placeholder="e.g. Rivaah Festive 30s" value={name} onChange={setName} errorMessage={show('name')} isRequired /></div>
          <div className="adv-span">
            <Select label="Brand" placeholder="Choose a brand" value={brandId} onChange={k => setBrandId(k ? String(k) : null)} errorMessage={show('brand')}
              description="Only brands approved for your company are listed.">
              {brands.map(b => <Select.Option key={b.id} id={b.id}>{b.name}</Select.Option>)}
            </Select>
            <p className="sl-small" style={{ margin: '4px 0 0' }}><Link to="/company/brands">Request a new brand</Link></p>
          </div>
          <div className="adv-span">
            <Field label="File type">
              <ChoiceCards label="File type" value={fileType} onChange={t => { setFileType(t); setFile(null); }} options={[
                { value: 'CPL', title: 'CPL', hint: 'DCP package for cinema screens.' },
                { value: 'Video', title: 'Video', hint: 'MP4/MOV for DOOH displays.' },
                { value: 'Image', title: 'Image', hint: 'Still image for DOOH displays.' }
              ]} />
            </Field>
          </div>
          <div className="adv-span">
            <FileDropzone label={isCpl ? 'CPL package' : `${fileType} file`} acceptedTypes={ACCEPT[fileType]} onFileSelect={fs => setFile(fs[0] ?? null)}
              isInvalid={!!show('file')} errorMessage={show('file')}>
              <FileDropzone.Icon><UploadIcon /></FileDropzone.Icon>
              <FileDropzone.Title>{file ? `${file.name} · ${bytes(file.size)}` : isCpl ? 'Drop the package here' : `Drop the ${fileType.toLowerCase()} here`}</FileDropzone.Title>
              <FileDropzone.Description>or click to browse · up to 12 GB</FileDropzone.Description>
            </FileDropzone>
          </div>
          {fileType !== 'Image' && (
            <Input label="Duration (seconds)" type="number" inputMode="numeric" value={secs} onChange={setSecs} errorMessage={show('duration')} isRequired />
          )}

          {isCpl ? <>
            <Input label="Censor certificate number" placeholder="CBFC/MUM/1007/2026" value={certNumber} onChange={setCertNumber} errorMessage={show('certNumber')} isRequired />
            <div className="adv-span">
              <FileDropzone label="Censor certificate" acceptedTypes={['application/pdf', 'image/png', 'image/jpeg']} onFileSelect={fs => setCertFile(fs[0] ?? null)}
                isInvalid={!!show('cert')} errorMessage={show('cert')}>
                <FileDropzone.Icon><UploadIcon /></FileDropzone.Icon>
                <FileDropzone.Title>{certFile ? certFile.name : 'Drop the certificate here'}</FileDropzone.Title>
                <FileDropzone.Description>PDF or image · single file</FileDropzone.Description>
              </FileDropzone>
            </div>
            <Select label="Certificate rating" value={rating} onChange={k => k && setRating(k as Rating)}>
              {(['U', 'UA', 'A'] as const).map(r => <Select.Option key={r} id={r}>{r}</Select.Option>)}
            </Select>
            <div className="adv-span">
              <Field label="Attributes" hint="Projection, aspect and sound formats in the package.">
                <ChipToggle label="Attributes" options={[...CPL_ATTRIBUTES]} value={attributes} onChange={v => setAttributes(v as CplAttribute[])} />
              </Field>
            </div>
          </> : (
            <div className="adv-span">
              {/*
                TODO(orientation-eligibility): whether a media's orientation should gate which placements it can be used on
                (e.g. Vertical media only on Vertical DOOH display groups) is an open product question. When decided, enforce it
                in the placement step (features/campaigns/wizard/PlacementSheet.tsx) and on the server's placement validation.
              */}
              <Field label="Orientation" error={show('orientation')} hint="Orientation does not yet gate placement eligibility.">
                <ChoiceCards label="Orientation" value={orientation} onChange={setOrientation} options={[
                  { value: 'Horizontal', title: 'Horizontal', hint: '16:9 landscape' },
                  { value: 'Vertical', title: 'Vertical', hint: '9:16 portrait' }
                ]} />
              </Field>
            </div>
          )}

          <div className="adv-span">
            <Field label="Languages"><ChipToggle label="Languages" options={LANGUAGES} value={languages} onChange={setLanguages} /></Field>
          </div>
          {create.error && <div className="adv-span"><Alert variant="negative" closable={false}>{errorText(create.error)}</Alert></div>}
        </form>
      </Card>
      <div className="sl-stack adv-rail">
        <Card title="Before you upload">
          <ul className="sl-small sl-muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Cinema placements need CPL media; DOOH placements need video or image.</li>
            <li>CPLs need a valid CBFC certificate and are validated before they turn Ready.</li>
            <li>Where and when media plays is set on placements, not here.</li>
          </ul>
        </Card>
        <div className="sl-row">
          <Button variant="primary" type="submit" form="media-form" isPending={create.isPending}>Start upload</Button>
          <Button variant="default" onPress={() => navigate('/media')}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
