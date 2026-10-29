import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { sessionApi, useSession } from '@slate/api';
import { Alert, Button, Dialog, Input, Textarea } from '@slate/ui';
import { errorText } from '../../components/org';

/**
 * The SAC whose registration link brought the advertiser here: `?sac=<subdomain>` on the sign-in URL,
 * else this deployment's default (in production each SAC gets its own host).
 */
const sacSubdomain = () =>
  new URLSearchParams(window.location.search).get('sac') ?? (import.meta.env.VITE_SAC_SUBDOMAIN as string | undefined) ?? 'pvrinox-media';

/** The SAC behind the sign-in link, with its branding. Only an explicit `?sac=` restyles the sign-in page. */
export function useLinkedSac() {
  const subdomain = sacSubdomain();
  return useQuery({ queryKey: ['sac-by-subdomain', subdomain], queryFn: () => sessionApi.sacBySubdomain(subdomain), retry: false });
}
export const hasSacParam = () => new URLSearchParams(window.location.search).has('sac');

export const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;

const blank = { companyName: '', gstin: '', pan: '', address: '', name: '', email: '', phone: '' };

/** "Register your company" entry on the sign-in page: creates the company + first admin, then signs in. */
export function SignUpEntry() {
  const [open, setOpen] = useState(false);
  return (
    <div className="adv-signup">
      <strong style={{ fontSize: 14 }}>New to Slate?</strong>
      <span className="sl-muted sl-small">Register your company, upload KYC documents and start planning while your sales house reviews them.</span>
      <div><Button variant="secondary" onPress={() => setOpen(true)}>Register your company</Button></div>
      {open && <SignUpDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function SignUpDialog({ onClose }: { onClose: () => void }) {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [f, setF] = useState(blank);
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof blank) => (v: string) => setF(x => ({ ...x, [k]: k === 'gstin' || k === 'pan' ? v.toUpperCase() : v }));

  const errors = {
    companyName: !f.companyName.trim() ? 'Company name is required.' : null,
    gstin: !GSTIN.test(f.gstin) ? 'Enter a valid 15-character GSTIN.' : null,
    pan: !PAN.test(f.pan) ? 'Enter a valid 10-character PAN.' : null,
    address: !f.address.trim() ? 'Registered address is required.' : null,
    name: !f.name.trim() ? 'Your name is required.' : null,
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? 'Enter a valid work email.' : null,
    phone: f.phone.replace(/\D/g, '').length !== 10 ? 'Enter a 10-digit phone number (without +91).' : null
  };
  const valid = Object.values(errors).every(e => !e);
  const err = (k: keyof typeof errors) => (touched ? errors[k] ?? undefined : undefined);

  const sac = useLinkedSac();

  const signup = useMutation({
    mutationFn: () => sessionApi.signup({ ...f, sacSubdomain: sacSubdomain(), companyName: f.companyName.trim(), name: f.name.trim() }),
    onSuccess: ({ userId }) => {
      navigate('/company');
      signIn(userId);
    }
  });

  const submit = () => {
    setTouched(true);
    if (valid && sac.data) signup.mutate();
  };

  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={560}>
      <Dialog.Header>Register your company</Dialog.Header>
      <Dialog.Body>
        <form className="adv-form" onSubmit={e => { e.preventDefault(); submit(); }} id="signup-form" noValidate>
          <div className="adv-span">
            {sac.isError
              ? <Alert variant="negative" closable={false}>This registration link isn’t valid. Ask your sales house for the correct link.</Alert>
              : <p className="sl-muted sl-small" style={{ margin: 0 }}>{sac.data ? <>Registering with <strong>{sac.data.name}</strong>, who will review your KYC.</> : 'Checking your registration link…'}</p>}
          </div>
          <div className="adv-span">
            <Input label="Registered company name" value={f.companyName} onChange={set('companyName')} isInvalid={!!err('companyName')} errorMessage={err('companyName')} isRequired />
          </div>
          <Input label="GSTIN" value={f.gstin} onChange={set('gstin')} isInvalid={!!err('gstin')} errorMessage={err('gstin')} placeholder="27AAKCM8812L1Z4" isRequired />
          <Input label="PAN" value={f.pan} onChange={set('pan')} isInvalid={!!err('pan')} errorMessage={err('pan')} placeholder="AAKCM8812L" isRequired />
          <div className="adv-span">
            <Textarea label="Registered address" value={f.address} onChange={set('address')} rows={2} isInvalid={!!err('address')} errorMessage={err('address')} isRequired />
          </div>
          <div className="adv-span"><strong style={{ fontSize: 13 }}>Your details</strong><p className="sl-muted sl-small" style={{ margin: '2px 0 0' }}>You become the company’s first admin.</p></div>
          <div className="adv-span">
            <Input label="Full name" value={f.name} onChange={set('name')} isInvalid={!!err('name')} errorMessage={err('name')} isRequired />
          </div>
          <Input label="Work email" type="email" value={f.email} onChange={set('email')} isInvalid={!!err('email')} errorMessage={err('email')} isRequired />
          <Input label="Phone" type="tel" prefix="+91" value={f.phone} onChange={set('phone')} isInvalid={!!err('phone')} errorMessage={err('phone')} isRequired />
          {signup.error && <div className="adv-span"><Alert variant="negative" closable={false}>{errorText(signup.error)}</Alert></div>}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="signup-form" isPending={signup.isPending} isDisabled={!sac.data}>Create account</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
