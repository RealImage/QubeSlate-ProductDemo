import { useState, type ReactNode } from 'react';
import { adminApi, type SacRow } from '@slate/api';
import {
  CONTACT_ROLES, DEFAULT_SUPPORT_EMAIL, LOGO_MAX_BYTES, LOGO_TYPES, cleanContacts, contactError, contrastText, defaultBranding, isEmail, isHexColour, primaryColourError,
  normaliseSacHost, orDash, sacUrlError, type SacContact, type SacContactRole
} from '@slate/domain';
import { Button, Card, FileDropzone, Input, KeyValue, slateLogoUrl } from '@slate/ui';
import { AddIcon, DeleteIcon } from 'prefab/icons';
import { Dash, FormDialog, useSectionSave } from './shared';

type Editing = 'details' | 'setup' | 'contacts' | null;

/** `editOnOpen` opens the details form straight away (the SACs list's "Edit SAC details" action). */
export function SacProfileTab({ sac, sacs, canEdit, editOnOpen = false }: { sac: SacRow; sacs: SacRow[]; canEdit: boolean; editOnOpen?: boolean }) {
  const [open, setOpen] = useState<Editing>(canEdit && editOnOpen ? 'details' : null);
  const close = () => setOpen(null);
  const edit = (d: Exclude<Editing, null>, what: string) => canEdit
    ? <Button variant="default" size="small" aria-label={`Edit ${what}`} onPress={() => setOpen(d)}>Edit</Button>
    : undefined;
  const b = sac.branding;
  const location = [sac.location.city, sac.location.country].filter(Boolean).join(', ');

  return (
    <div className="sl-stack">
      <Card title="SAC details" actions={edit('details', 'SAC details')}>
        <KeyValue items={[
          ['SAC name', <Dash value={sac.name} />],
          ['SAC legal name', <Dash value={sac.legalName} />],
          ['Location', <Dash value={location} />]
        ]} />
      </Card>

      <Card title="SAC setup" description="The SAC’s portal address and how its advertiser portal looks." actions={edit('setup', 'SAC setup')}>
        <KeyValue items={[
          ['SAC URL', <span className="sl-mono">{orDash(sac.url)}</span>],
          ['Support email', <Dash value={sac.supportEmail} />],
          ['Header colour', <ColourValue hex={b.headerColor} />],
          ['Primary colour', <ColourValue hex={b.primaryColor} />],
          ['Secondary colour', <ColourValue hex={b.secondaryColor} />],
          ['Logo', b.logo
            ? <img src={b.logo} alt={`${sac.name} logo`} height={32} className="sl-logo" />
            : <span className="sl-row"><img src={slateLogoUrl} alt="Qube Slate logo" height={24} /><span className="sl-muted sl-small">Slate logo (default)</span></span>]
        ]} />
      </Card>

      <Card title="Contact details" actions={edit('contacts', 'contact details')}>
        <KeyValue items={CONTACT_ROLES.map(({ role, label }) => [
          label,
          sac.contacts[role].length
            ? <span className="sl-stack" style={{ gap: 6 }}>{sac.contacts[role].map((c, i) => (
              <span key={i}>{c.name}<span className="sl-muted"> · {orDash(c.email)} · {orDash(c.phone)}</span></span>
            ))}</span>
            : '--'
        ] as [string, ReactNode])} />
      </Card>

      {open === 'details' && <DetailsDialog sac={sac} onClose={close} />}
      {open === 'setup' && <SetupDialog sac={sac} others={sacs.filter(s => s.id !== sac.id)} onClose={close} />}
      {open === 'contacts' && <ContactsDialog sac={sac} onClose={close} />}
    </div>
  );
}

function ColourValue({ hex }: { hex: string }) {
  return (
    <span className="sl-row" style={{ gap: 8 }}>
      <span aria-hidden style={{ width: 18, height: 18, borderRadius: 4, background: hex, border: '1px solid var(--sl-control)' }} />
      <span className="sl-mono">{hex}</span>
    </span>
  );
}

// ---------- SAC details ----------

function DetailsDialog({ sac, onClose }: { sac: SacRow; onClose: () => void }) {
  const [f, setF] = useState({ name: sac.name, legalName: sac.legalName, city: sac.location.city, country: sac.location.country });
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const save = useSectionSave(() => adminApi.updateSacDetails(sac.id, f), 'SAC details saved.', onClose);
  return (
    <FormDialog title="Edit SAC details" onClose={onClose} onSubmit={() => save.mutate(f)} pending={save.isPending} error={save.error} valid={f.name.trim() !== ''}>
      <Input label="SAC name" value={f.name} onChange={set('name')} isRequired errorMessage={f.name.trim() === '' ? 'SAC name is required.' : undefined} />
      <Input label="SAC legal name" value={f.legalName} onChange={set('legalName')} />
      <div className="sl-grid sl-grid--2">
        <Input label="City" value={f.city} onChange={set('city')} />
        <Input label="Country" value={f.country} onChange={set('country')} />
      </div>
    </FormDialog>
  );
}

// ---------- SAC setup ----------

function ColourField({ label, value, onChange, check }: { label: string; value: string; onChange: (v: string) => void; check?: (v: string) => string | null }) {
  const ok = isHexColour(value);
  const error = !ok ? 'Use a #RRGGBB hex value.' : check?.(value) ?? null;
  return (
    <div className="sl-row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
      <div style={{ flex: 1 }}>
        <Input label={label} value={value} onChange={v => onChange(v.trim())} placeholder="#084782" isInvalid={!!error}
          errorMessage={error ?? undefined} />
      </div>
      <input type="color" aria-label={`${label} picker`} value={ok ? value.toLowerCase() : '#000000'} onChange={e => onChange(e.target.value)}
        style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--sl-control)', borderRadius: 6, background: '#fff', cursor: 'pointer' }} />
    </div>
  );
}

/** Live preview of the SAC's header strip, a primary button and a secondary accent. */
function BrandPreview({ header, primary, secondary, logo }: { header: string; primary: string; secondary: string; logo: string | null }) {
  const safe = (c: string, fallback: string) => (isHexColour(c) ? c : fallback);
  const h = safe(header, '#cccccc');
  const p = safe(primary, '#cccccc');
  const s = safe(secondary, '#cccccc');
  return (
    <div role="img" aria-label="Brand preview" style={{ border: '1px solid var(--sl-hairline)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: h, color: contrastText(h), borderBottom: `3px solid ${s}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ background: '#fff', borderRadius: 6, padding: '4px 8px', display: 'inline-flex' }}>
          <img src={logo ?? slateLogoUrl} alt="" height={20} className="sl-logo" />
        </span>
        <strong style={{ fontSize: 13 }}>Advertiser portal</strong>
      </div>
      <div style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', background: '#fff' }}>
        <span style={{ background: p, color: contrastText(p), borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>Primary button</span>
        <span style={{ border: `2px solid ${s}`, color: s, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Secondary accent</span>
      </div>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function SetupDialog({ sac, others, onClose }: { sac: SacRow; others: SacRow[]; onClose: () => void }) {
  const [f, setF] = useState({ url: sac.url, supportEmail: sac.supportEmail, ...sac.branding });
  const [logoError, setLogoError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }));
  const save = useSectionSave(() => adminApi.updateSacSetup(sac.id, { ...f, url: normaliseSacHost(f.url), supportEmail: f.supportEmail.trim() || DEFAULT_SUPPORT_EMAIL }), 'SAC setup saved.', onClose);

  const urlError = sacUrlError(f.url, others);
  const emailBad = f.supportEmail.trim() !== '' && !isEmail(f.supportEmail);
  const colours = [f.headerColor, f.primaryColor, f.secondaryColor].every(isHexColour) && !primaryColourError(f.primaryColor);
  const valid = !urlError && !emailBad && colours;
  const defaults = defaultBranding();

  const pickLogo = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return setLogoError('Upload a PNG, SVG or JPEG image.');
    if (file.size > LOGO_MAX_BYTES) return setLogoError('The logo must be 200 KB or smaller.');
    try {
      // Keep the current logo until the replacement has been read.
      const logo = await readAsDataUrl(file);
      setLogoError(null);
      setF(p => ({ ...p, logo }));
    } catch {
      setLogoError('That file could not be read.');
    }
  };

  return (
    <FormDialog title="Edit SAC setup" width={620} onClose={onClose} onSubmit={() => save.mutate(f)} pending={save.isPending} error={save.error} valid={valid}>
      <Input label="SAC URL" value={f.url} onChange={set('url')} isRequired placeholder="qcn.slate.com" isInvalid={!!urlError} errorMessage={urlError ?? undefined}
        description="Host only. Its first label identifies the SAC, e.g. sign-up links use ?sac=qcn." />
      <Input label="Support email" type="email" value={f.supportEmail} onChange={set('supportEmail')} placeholder={DEFAULT_SUPPORT_EMAIL}
        isInvalid={emailBad} errorMessage={emailBad ? 'Enter a valid email address.' : undefined} description={`Leave blank to use ${DEFAULT_SUPPORT_EMAIL}.`} />
      <div className="sl-grid sl-grid--3">
        <ColourField label="Header colour" value={f.headerColor} onChange={set('headerColor')} />
        <ColourField label="Primary colour" value={f.primaryColor} onChange={set('primaryColor')} check={primaryColourError} />
        <ColourField label="Secondary colour" value={f.secondaryColor} onChange={set('secondaryColor')} />
      </div>
      <div><Button variant="link" size="small" onPress={() => setF(p => ({ ...p, headerColor: defaults.headerColor, primaryColor: defaults.primaryColor, secondaryColor: defaults.secondaryColor }))}>Reset colours to Slate</Button></div>
      <BrandPreview header={f.headerColor} primary={f.primaryColor} secondary={f.secondaryColor} logo={f.logo} />
      <FileDropzone label="Logo" acceptedTypes={LOGO_TYPES} onFileSelect={files => void pickLogo(files)} isInvalid={!!logoError} errorMessage={logoError ?? undefined}
        description="PNG, SVG or JPEG, up to 200 KB.">
        <FileDropzone.Title>Drop a logo here or browse</FileDropzone.Title>
        <FileDropzone.Description>PNG, SVG or JPEG · 200 KB max</FileDropzone.Description>
      </FileDropzone>
      <div className="sl-row" style={{ justifyContent: 'space-between' }}>
        <span className="sl-row">
          <img src={f.logo ?? slateLogoUrl} alt={f.logo ? 'Uploaded logo preview' : 'Slate logo'} height={32} className="sl-logo" />
          <span className="sl-muted sl-small">{f.logo ? 'Uploaded logo' : 'Using the Slate logo'}</span>
        </span>
        {f.logo && <Button variant="default" size="small" onPress={() => { setLogoError(null); setF(p => ({ ...p, logo: null })); }}>Reset to Slate logo</Button>}
      </div>
    </FormDialog>
  );
}

// ---------- contacts ----------

type Contacts = Record<SacContactRole, SacContact[]>;

const rowProblem = (c: SacContact) => (c.name.trim() || c.email.trim() || c.phone.trim() ? contactError(c) : null);

function ContactsDialog({ sac, onClose }: { sac: SacRow; onClose: () => void }) {
  const [f, setF] = useState<Contacts>(() => structuredClone(sac.contacts));
  const save = useSectionSave((v: Contacts) => adminApi.updateSacContacts(sac.id, v), 'Contact details saved.', onClose);
  const update = (role: SacContactRole, next: SacContact[]) => setF(p => ({ ...p, [role]: next }));
  const valid = CONTACT_ROLES.every(({ role }) => f[role].every(c => !rowProblem(c)));
  const submit = () => save.mutate(Object.fromEntries(CONTACT_ROLES.map(({ role }) => [role, cleanContacts(f[role])])) as Contacts);

  return (
    <FormDialog title="Edit contact details" width={680} onClose={onClose} onSubmit={submit} pending={save.isPending} error={save.error} valid={valid}>
      {CONTACT_ROLES.map(({ role, label }) => (
        <fieldset key={role} className="sl-stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
          <legend style={{ fontWeight: 600, fontSize: 14, padding: 0, marginBottom: 4 }}>{label}</legend>
          {f[role].length === 0 && <span className="sl-muted sl-small">No contacts.</span>}
          {f[role].map((c, i) => {
            const set = (patch: Partial<SacContact>) => update(role, f[role].map((x, j) => (j === i ? { ...x, ...patch } : x)));
            const touched = !!(c.name.trim() || c.email.trim() || c.phone.trim());
            const emailBad = touched && !isEmail(c.email);
            const nameBad = touched && !c.name.trim();
            return (
              <div key={i} className="sl-row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
                <div style={{ flex: 1 }}><Input label="Name" value={c.name} onChange={v => set({ name: v })} isInvalid={nameBad} errorMessage={nameBad ? 'Name is required.' : undefined} /></div>
                <div style={{ flex: 1.3 }}><Input label="Email" type="email" value={c.email} onChange={v => set({ email: v })} isInvalid={emailBad} errorMessage={emailBad ? 'Enter a valid email.' : undefined} /></div>
                <div style={{ flex: 1 }}><Input label="Phone" type="tel" value={c.phone} onChange={v => set({ phone: v })} /></div>
                <Button variant="default" iconOnly aria-label={`Remove ${label} contact ${i + 1}`} onPress={() => update(role, f[role].filter((_, j) => j !== i))}><DeleteIcon /></Button>
              </div>
            );
          })}
          <div><Button variant="default" size="small" onPress={() => update(role, [...f[role], { name: '', email: '', phone: '' }])}><AddIcon />Add contact</Button></div>
        </fieldset>
      ))}
    </FormDialog>
  );
}
