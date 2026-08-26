import { useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useAppState } from '../state/AppStateContext';
import { clients, targetGroups, media, ratePerSecond } from '../data/mockData';
import { money, secs, fmtDate } from '../data/helpers';
import type { FormFields } from '../state/types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Card, StatusTag } from '../components/ui/primitives';

const STEP_TITLES = ['Campaign Details', 'Target Groups', 'Media Selection', 'Placement Planning', 'Review & Publish'];
const inputStyle = { height: 38, padding: '0 12px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13.5, color: '#08090A', outline: 'none', width: '100%' } as const;
const labelTextStyle = { fontSize: 12.5, fontWeight: 500, color: '#4A5A6C' } as const;

export function CreateCampaign() {
  const { state, patch, navigateTo } = useAppState();
  const { step, f, tgSel, mediaSel, placements, published } = state;

  const onField = (field: keyof FormFields, value: string | boolean) => {
    patch(s => {
      const nf = { ...s.f, [field]: value } as FormFields;
      if (field === 'client') {
        const c = clients.find(x => x.name === value);
        nf.brand = c ? c.brands[0] : '';
        if (c) { nf.billingName = c.billing; nf.billingAddress = c.addresses[0]; }
      }
      return { f: nf };
    });
  };
  const onText = (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onField(field, e.target.value);
  const onCheck = (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement>) => onField(field, e.target.checked);

  const activeClient = useMemo(() => clients.find(c => c.name === f.client) || null, [f.client]);
  const clientAddresses = activeClient ? activeClient.addresses : [];
  const surfaceLabels = [f.onScreen && 'On-Screen', f.lobby && 'Lobby', f.digitalWeb && 'Digital Web', f.digitalApp && 'Digital App'].filter(Boolean).join(', ');

  const selTGs = useMemo(() => targetGroups.filter(t => tgSel.indexOf(t.id) >= 0), [tgSel]);
  const selMedia = useMemo(() => media.filter(m => mediaSel.indexOf(m.id) >= 0), [mediaSel]);
  const totalScreens = selTGs.reduce((a, t) => a + t.screens, 0);
  const totalTheatres = selTGs.reduce((a, t) => a + t.theatres, 0);

  const tgById = useMemo(() => Object.fromEntries(targetGroups.map(t => [t.id, t])), []);
  const mById = useMemo(() => Object.fromEntries(media.map(m => [m.id, m])), []);

  const { placementRows, weeklyPlays, weeklySeconds } = useMemo(() => {
    let wp = 0, ws = 0;
    const rows = placements.map(p => {
      const tg = tgById[p.tg] || { name: '—', screens: 0, theatres: 0 };
      const m = mById[p.media] || { name: '—', seconds: 0, status: 'Missing', tone: 'negative' };
      const sec = p.plays * m.seconds * tg.screens;
      wp += p.plays * tg.screens;
      ws += sec;
      return {
        id: p.id, targetGroup: tg.name, tgMeta: `${tg.theatres} theatres · ${tg.screens} screens`,
        mediaName: m.name, mediaMeta: `${m.seconds}s · ${m.format || ''}`,
        pack: p.pack, plays: (p.plays * tg.screens).toLocaleString('en-US'),
        seconds: sec.toLocaleString('en-US'),
        status: m.status === 'Available' ? 'Active' : 'Pending',
        tone: m.status === 'Available' ? 'positive' : 'notice'
      };
    });
    return { placementRows: rows, weeklyPlays: wp, weeklySeconds: ws };
  }, [placements, tgById, mById]);

  const weeklySpend = weeklySeconds * ratePerSecond;
  const durations = selMedia.reduce((a, m) => a + m.seconds, 0);

  const cartRows = [
    { label: 'Target groups', value: String(selTGs.length) },
    { label: 'Theatres', value: totalTheatres.toLocaleString('en-US') },
    { label: 'Screens', value: totalScreens.toLocaleString('en-US') },
    { label: 'Creatives', value: String(selMedia.length) },
    { label: 'Total creative length', value: secs(durations) },
    { label: 'Placements', value: String(placements.length) },
    { label: 'Weekly plays', value: weeklyPlays.toLocaleString('en-US') },
    { label: 'Weekly seconds', value: weeklySeconds.toLocaleString('en-US') }
  ];

  const reviewRows = [
    { label: 'Campaign name', value: f.name || '—' },
    { label: 'Campaign type', value: f.type || '—' },
    { label: 'Client', value: f.client || '—' },
    { label: 'Brand', value: f.brand || '—' },
    { label: 'Flight', value: `${fmtDate(f.start)} – ${fmtDate(f.end)}` },
    { label: 'Surfaces', value: surfaceLabels || '—' },
    { label: 'Campaign mode', value: f.mode },
    { label: 'Target groups', value: selTGs.map(t => t.name).join(', ') || '—' },
    { label: 'Creatives', value: selMedia.map(m => m.name).join(', ') || '—' },
    { label: 'Screens reached', value: totalScreens.toLocaleString('en-US') },
    { label: 'Weekly plays', value: weeklyPlays.toLocaleString('en-US') },
    { label: 'Est. weekly spend', value: money(weeklySpend) },
    { label: 'Billing company', value: f.billingName || '—' },
    { label: 'Billing cycle', value: f.billingCycle },
    { label: 'Advance payment', value: f.advance ? (f.advanceAmount || 'Required') : 'Not required' },
    { label: 'PO / RO ID', value: f.orderId || '—' },
    { label: 'Third-party order ID', value: f.thirdPartyOrderId || '—' }
  ];

  const missing = selMedia.filter(m => m.status !== 'Available');
  const preflight = [
    { label: 'Campaign details complete', detail: f.name && f.type ? 'Validated' : 'Name and type required', glyph: f.name && f.type ? '✓' : '!', color: f.name && f.type ? '#0F7B3F' : '#E65C00' },
    { label: 'Inventory available for all target groups', detail: `${totalScreens} screens held`, glyph: totalScreens > 0 ? '✓' : '!', color: totalScreens > 0 ? '#0F7B3F' : '#E65C00' },
    { label: 'Creative content ingested', detail: missing.length ? `${missing.length} creative(s) not available` : 'All creatives ready', glyph: missing.length ? '!' : '✓', color: missing.length ? '#E65C00' : '#0F7B3F' },
    { label: 'Placements within playlist boundaries', detail: `Pre-show max 12:00 · using ${secs(durations)}`, glyph: durations <= 720 ? '✓' : '!', color: durations <= 720 ? '#0F7B3F' : '#CF1322' }
  ];

  const steps = STEP_TITLES.map((t, i) => {
    const n = i + 1, done = step > n, cur = step === n;
    return {
      n, title: t, badge: done ? '✓' : String(n),
      ring: done || cur ? '#084782' : '#D3DAE2',
      fill: done ? '#084782' : (cur ? '#E8F0F8' : '#FFFFFF'),
      numColor: done ? '#FFFFFF' : (cur ? '#084782' : '#97A5B5'),
      color: done || cur ? '#08090A' : '#97A5B5',
      weight: cur ? 600 : 500
    };
  });

  const toggleTG = (id: string) => patch(s => ({ tgSel: s.tgSel.indexOf(id) >= 0 ? s.tgSel.filter(x => x !== id) : s.tgSel.concat([id]) }));
  const toggleMedia = (id: string) => patch(s => ({ mediaSel: s.mediaSel.indexOf(id) >= 0 ? s.mediaSel.filter(x => x !== id) : s.mediaSel.concat([id]) }));
  const addPlacement = () => patch(s => ({
    placements: s.placements.concat([{ id: 'p' + Date.now(), tg: s.f.pTG, media: s.f.pMedia, pack: s.f.pPack, plays: Number(s.f.pPlays) || 0 }])
  }));
  const removePlacement = (id: string) => patch(s => ({ placements: s.placements.filter(p => p.id !== id) }));
  const prevStep = () => patch(s => ({ step: Math.max(1, s.step - 1) }));
  const nextStep = () => patch(s => (s.step === 5 ? { published: true } : { step: s.step + 1 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1500 }}>
      <div>
        <button
          onClick={() => navigateTo('/campaigns')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', padding: 0, marginBottom: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#084782', cursor: 'pointer' }}
        >
          <Icon name="ChevronLeft" size={16} />
          Back to Campaigns
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em', color: '#08090A' }}>Create New Campaign</h1>
        <p style={{ margin: '5px 0 0', fontSize: 14, color: '#677A90' }}>Booking, targeting, content and placement — the commercial intent that becomes a pre-show schedule.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: '1 1 560px', minWidth: 0 }}>
          <Card padding="20px 24px">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              {steps.map(s => (
                <button
                  key={s.n}
                  onClick={() => patch({ step: s.n })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px', minWidth: 0, padding: 8, border: 0, borderRadius: 6, background: 'transparent', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, flex: '0 0 auto', border: `2px solid ${s.ring}`, borderRadius: 1000, background: s.fill, color: s.numColor, fontSize: 12.5, fontWeight: 600 }}>{s.badge}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: s.weight, color: s.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                    <span style={{ display: 'block', fontSize: 11, color: '#97A5B5' }}>Step {s.n}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {step === 1 && (
            <Step1
              f={f} onText={onText} onCheck={onCheck}
              activeClient={activeClient} clientAddresses={clientAddresses}
            />
          )}
          {step === 2 && <Step2 tgSel={tgSel} onToggleTG={toggleTG} />}
          {step === 3 && <Step3 mediaSel={mediaSel} onToggleMedia={toggleMedia} />}
          {step === 4 && (
            <Step4
              f={f} onText={onText} selTGs={selTGs} selMedia={selMedia}
              placementRows={placementRows} onAdd={addPlacement} onRemove={removePlacement}
              tgById={tgById}
            />
          )}
          {step === 5 && <Step5 published={published} totalScreens={totalScreens} reviewRows={reviewRows} preflight={preflight} />}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', background: '#FFFFFF', border: '1px solid #E1E4E9', borderRadius: 8, boxShadow: '0 1px 2px rgba(4,38,82,.06)' }}>
            <Button variant="secondary" size="medium" onClick={prevStep} disabled={step === 1}>Previous</Button>
            <span style={{ fontSize: 12.5, color: '#677A90' }}>Step {step} of 5</span>
            <Button variant="primary" size="medium" onClick={nextStep}>{step === 5 ? 'Publish Campaign' : 'Next Step'}</Button>
          </div>
        </div>

        <aside style={{ position: 'sticky', top: 0, flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, background: '#FFFFFF', border: '1px solid #E1E4E9', borderRadius: 8, boxShadow: '0 1px 2px rgba(4,38,82,.06)', padding: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#08090A' }}>Booking summary</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#677A90' }}>Recomputes as you select.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {cartRows.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid #EDF0F3' }}>
                <span style={{ fontSize: 12.5, color: '#677A90' }}>{c.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{c.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 6, background: '#F0F5FA' }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#084782' }}>Est. weekly spend</span>
            <span style={{ fontSize: 19, fontWeight: 600, color: '#084782', fontVariantNumeric: 'tabular-nums' }}>{money(weeklySpend)}</span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: '#97A5B5', lineHeight: 1.5 }}>Rate card: {money(ratePerSecond * 1000)} / 1,000s per second per screen. Inventory is held for 24 hours after publish.</p>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Step 1 ---------------- */

function Step1({ f, onText, onCheck, activeClient, clientAddresses }: {
  f: FormFields;
  onText: (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheck: (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement>) => void;
  activeClient: { name: string; brands: string[]; billing: string; addresses: string[] } | null;
  clientAddresses: string[];
}) {
  const surfaceOptions: { field: keyof FormFields; label: string; on: boolean }[] = [
    { field: 'onScreen', label: 'On-Screen Advertising', on: f.onScreen },
    { field: 'lobby', label: 'Lobby Advertising', on: f.lobby },
    { field: 'digitalWeb', label: 'Digital Web Advertising', on: f.digitalWeb },
    { field: 'digitalApp', label: 'Digital Application Advertising', on: f.digitalApp }
  ];
  const contactGroups: { title: string; nameField: keyof FormFields; emailField: keyof FormFields; phoneField: keyof FormFields }[] = [
    { title: 'Client Contact', nameField: 'clientContactName', emailField: 'clientContactEmail', phoneField: 'clientContactPhone' },
    { title: 'Billing Contact', nameField: 'billingContactName', emailField: 'billingContactEmail', phoneField: 'billingContactPhone' },
    { title: 'Sales Contact', nameField: 'salesContactName', emailField: 'salesContactEmail', phoneField: 'salesContactPhone' }
  ];
  const billingCompanyOptions = Array.from(new Set(clients.map(c => c.billing).concat(['Halcyon Media Group', 'Bright Harbour Media'])));
  const modeHint = f.mode === 'Fixed Commercial Terms' ? 'Rate and play count agreed up front; inventory is held on publish.' : 'Delivery optimised against a reach target; plays vary by screen.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Campaign Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Campaign Name <span style={{ color: '#CF1322' }}>*</span></span>
            <input value={f.name} onChange={onText('name')} placeholder="e.g. Summer Blockbuster Promotion" style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Campaign Type <span style={{ color: '#CF1322' }}>*</span></span>
            <select value={f.type} onChange={onText('type')} style={{ ...inputStyle, background: '#FFFFFF' }}>
              <option value="">Select campaign type</option>
              <option value="Private">Private</option>
              <option value="Political">Political</option>
              <option value="PSU">PSU</option>
              <option value="Government - Central">Government — Central</option>
              <option value="Government - State">Government — State</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Client <span style={{ color: '#CF1322' }}>*</span></span>
            <select value={f.client} onChange={onText('client')} style={{ ...inputStyle, background: '#FFFFFF' }}>
              <option value="">Search &amp; select client</option>
              {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <span style={{ fontSize: 11.5, color: '#97A5B5' }}>Brand owner this campaign is booked for.</span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Brand <span style={{ color: '#CF1322' }}>*</span></span>
            <select value={f.brand} onChange={onText('brand')} style={{ ...inputStyle, background: '#FFFFFF' }}>
              <option value="">Select brand</option>
              {(activeClient ? activeClient.brands : []).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <span style={{ fontSize: 11.5, color: '#97A5B5' }}>{activeClient ? `${activeClient.brands.length} brand(s) registered to this client` : 'Select a client first'}</span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Validity Start Date <span style={{ color: '#CF1322' }}>*</span></span>
            <input type="date" value={f.start} onChange={onText('start')} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Validity End Date <span style={{ color: '#CF1322' }}>*</span></span>
            <input type="date" value={f.end} onChange={onText('end')} style={inputStyle} />
          </label>
        </div>
      </Card>

      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Campaign Specifications</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#677A90' }}>Which advertising surfaces this campaign buys, and how its commercial terms are set.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px 16px' }}>
          {surfaceOptions.map(s => (
            <label key={s.field} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: `1px solid ${s.on ? '#084782' : '#E7EBF0'}`, borderRadius: 6, background: s.on ? '#F0F5FA' : '#FFFFFF', cursor: 'pointer' }}>
              <input type="checkbox" checked={s.on} onChange={onCheck(s.field)} style={{ width: 16, height: 16, accentColor: '#084782', cursor: 'pointer', flex: '0 0 auto' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#08090A' }}>{s.label}</span>
            </label>
          ))}
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16, maxWidth: 340 }}>
          <span style={labelTextStyle}>Campaign Mode <span style={{ color: '#CF1322' }}>*</span></span>
          <select value={f.mode} onChange={onText('mode')} style={{ ...inputStyle, background: '#FFFFFF' }}>
            <option value="Fixed Commercial Terms">Fixed Commercial Terms</option>
            <option value="Dynamic - Views Reach">Dynamic — Views Reach</option>
          </select>
          <span style={{ fontSize: 11.5, color: '#97A5B5' }}>{modeHint}</span>
        </label>
      </Card>

      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Contacts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {contactGroups.map(g => (
            <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>{g.title}</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 12, color: '#4A5A6C' }}>Name</span>
                  <input value={f[g.nameField] as string} onChange={onText(g.nameField)} placeholder="Full name" style={{ ...inputStyle, height: 36, fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 12, color: '#4A5A6C' }}>Email</span>
                  <input type="email" value={f[g.emailField] as string} onChange={onText(g.emailField)} placeholder="name@company.com" style={{ ...inputStyle, height: 36, fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 12, color: '#4A5A6C' }}>Phone Number</span>
                  <input type="tel" value={f[g.phoneField] as string} onChange={onText(g.phoneField)} placeholder="+1 555 0100" style={{ ...inputStyle, height: 36, fontSize: 13 }} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Billing &amp; Media Agency</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Billing Company Name</span>
            <select value={f.billingName} onChange={onText('billingName')} style={{ ...inputStyle, background: '#FFFFFF' }}>
              {billingCompanyOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Billing Company Address</span>
            <select value={f.billingAddress || (activeClient ? activeClient.addresses[0] : '')} onChange={onText('billingAddress')} disabled={clientAddresses.length < 2} style={{ ...inputStyle, color: '#4A5A6C', background: '#F7FAFC' }}>
              {clientAddresses.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <span style={{ fontSize: 11.5, color: '#97A5B5' }}>{clientAddresses.length > 1 ? `${clientAddresses.length} registered addresses — select the billing entity` : 'Read-only — single registered address'}</span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Billing Cycle</span>
            <select value={f.billingCycle} onChange={onText('billingCycle')} style={{ ...inputStyle, background: '#FFFFFF' }}>
              <option value="Weekly">Weekly</option>
              <option value="Fortnightly">Fortnightly</option>
              <option value="Monthly">Monthly</option>
              <option value="On Campaign Completion">On Campaign Completion</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Order Region</span>
            <select value={f.orderRegion} onChange={onText('orderRegion')} style={{ ...inputStyle, background: '#FFFFFF' }}>
              <option value="">Select region</option>
              <option value="Northeast">Northeast</option>
              <option value="West">West</option>
              <option value="Midwest">Midwest</option>
              <option value="South">South</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Purchase Order ID / RO ID</span>
            <input value={f.orderId} onChange={onText('orderId')} placeholder="Enter PO or RO ID" style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Third-Party Order ID</span>
            <input value={f.thirdPartyOrderId} onChange={onText('thirdPartyOrderId')} placeholder="Agency or platform reference" style={inputStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, gridColumn: '1 / -1', padding: '11px 14px', border: '1px solid #E7EBF0', borderRadius: 6, background: '#F7FAFC', cursor: 'pointer' }}>
            <input type="checkbox" checked={f.advance} onChange={onCheck('advance')} style={{ width: 16, height: 16, accentColor: '#084782', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: '#08090A' }}>Advance payment required before scheduling</span>
          </label>
          {f.advance && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={labelTextStyle}>Advance Payment</span>
              <input value={f.advanceAmount} onChange={onText('advanceAmount')} placeholder="Amount or % of booked value" style={inputStyle} />
            </label>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Step 2 ---------------- */

function Step2({ tgSel, onToggleTG }: { tgSel: string[]; onToggleTG: (id: string) => void }) {
  const rows = targetGroups.map(t => ({
    id: t.id, name: t.name, screenCount: t.screens,
    meta: `${t.theatres} theatres · valid ${fmtDate(t.validFrom)} – ${fmtDate(t.validTill)} · ${t.createdBy}`,
    statusLabel: t.status === 'active' ? 'Active' : t.status === 'expired' ? 'Expired' : 'Upcoming',
    tone: t.status === 'active' ? 'positive' : t.status === 'expired' ? 'default' : 'notice',
    checked: tgSel.indexOf(t.id) >= 0
  }));
  return (
    <Card padding={0} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #E1E4E9' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#08090A' }}>Target Groups</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#677A90' }}>Select the theatre and screen groupings this campaign should reach.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(t => (
          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid #EDF0F3', cursor: 'pointer', background: t.checked ? '#F7FAFC' : '#FFFFFF' }}>
            <input type="checkbox" checked={t.checked} onChange={() => onToggleTG(t.id)} style={{ width: 16, height: 16, accentColor: '#084782', cursor: 'pointer', flex: '0 0 auto' }} />
            <span style={{ flex: '1 1 auto', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{t.name}</span>
              <span style={{ display: 'block', fontSize: 12, color: '#677A90', marginTop: 2 }}>{t.meta}</span>
            </span>
            <StatusTag tone={t.tone}>{t.statusLabel}</StatusTag>
            <span style={{ width: 92, textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{t.screenCount} screens</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Step 3 ---------------- */

function Step3({ mediaSel, onToggleMedia }: { mediaSel: string[]; onToggleMedia: (id: string) => void }) {
  const rows = media.map(m => {
    const on = mediaSel.indexOf(m.id) >= 0;
    return {
      id: m.id, name: m.name, cpl: m.cpl, status: m.status, tone: m.tone,
      duration: `${m.seconds}s`, format: m.format, size: m.size,
      border: on ? '#084782' : '#E1E4E9', bg: on ? '#F7FAFC' : '#FFFFFF',
      check: on ? '✓' : '', checkBg: on ? '#084782' : '#FFFFFF', checkBorder: on ? '#084782' : '#D3DAE2'
    };
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="18px 24px">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#08090A' }}>Media Selection</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#677A90' }}>Creative that will be packaged into pre-show playlists. Missing content blocks scheduling.</p>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        {rows.map(m => (
          <button
            key={m.id}
            onClick={() => onToggleMedia(m.id)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: `1.5px solid ${m.border}`, borderRadius: 8, background: m.bg, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <StatusTag tone={m.tone}>{m.status}</StatusTag>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, border: `1.5px solid ${m.checkBorder}`, borderRadius: 4, background: m.checkBg, color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>{m.check}</span>
            </span>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#08090A' }}>{m.name}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: '#677A90', fontFamily: "'JetBrains Mono', ui-monospace, monospace", wordBreak: 'break-all' }}>{m.cpl}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#4A5A6C' }}>
              <span>{m.duration}</span><span style={{ color: '#C3CCD6' }}>·</span>
              <span>{m.format}</span><span style={{ color: '#C3CCD6' }}>·</span>
              <span>{m.size}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Step 4 ---------------- */

interface PlacementRow { id: string; targetGroup: string; tgMeta: string; mediaName: string; mediaMeta: string; pack: string; plays: string; seconds: string; status: string; tone: string }

function Step4({ f, onText, selTGs, selMedia, placementRows, onAdd, onRemove, tgById }: {
  f: FormFields;
  onText: (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selTGs: { id: string; name: string }[];
  selMedia: { id: string; name: string; seconds: number }[];
  placementRows: PlacementRow[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  tgById: Record<string, { screens: number }>;
}) {
  const placementHint = `${f.pPlays} plays/week × ${tgById[f.pTG] ? tgById[f.pTG].screens : 0} screens`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Add Placement</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#677A90' }}>A placement pairs a target group with a creative and its playback parameters.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Target Group</span>
            <select value={f.pTG} onChange={onText('pTG')} style={{ ...inputStyle, fontSize: 13, background: '#FFFFFF' }}>
              {selTGs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Media</span>
            <select value={f.pMedia} onChange={onText('pMedia')} style={{ ...inputStyle, fontSize: 13, background: '#FFFFFF' }}>
              {selMedia.map(m => <option key={m.id} value={m.id}>{m.name} ({m.seconds}s)</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Playlist Pack · Position</span>
            <select value={f.pPack} onChange={onText('pPack')} style={{ ...inputStyle, fontSize: 13, background: '#FFFFFF' }}>
              <option value="Pre Show · A">Pre Show · Position A</option>
              <option value="Pre Show · B">Pre Show · Position B</option>
              <option value="Pre Show · C">Pre Show · Position C</option>
              <option value="Intermission · A">Intermission · Position A</option>
              <option value="Intermission · B">Intermission · Position B</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelTextStyle}>Weekly Play Count</span>
            <input type="number" value={f.pPlays} onChange={onText('pPlays')} style={{ ...inputStyle, fontSize: 13 }} />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <Button variant="primary" size="small" onClick={onAdd}>Add Placement</Button>
          <span style={{ fontSize: 12.5, color: '#677A90' }}>{placementHint}</span>
        </div>
      </Card>

      <Card padding={0} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Target Group', 'Media', 'Pack · Position'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>{h}</th>
              ))}
              <th style={{ textAlign: 'right', padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>Weekly plays</th>
              <th style={{ textAlign: 'right', padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>Weekly seconds</th>
              <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#677A90', borderBottom: '2px solid #E1E4E9' }}>Status</th>
              <th style={{ padding: '10px 20px', borderBottom: '2px solid #E1E4E9' }}></th>
            </tr>
          </thead>
          <tbody>
            {placementRows.map(p => (
              <tr key={p.id}>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>
                  {p.targetGroup}
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 400, color: '#677A90', marginTop: 2 }}>{p.tgMeta}</span>
                </td>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, color: '#08090A' }}>
                  {p.mediaName}
                  <span style={{ display: 'block', fontSize: 11.5, color: '#677A90', marginTop: 2 }}>{p.mediaMeta}</span>
                </td>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13, color: '#4A5A6C', whiteSpace: 'nowrap' }}>{p.pack}</td>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, color: '#08090A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.plays}</td>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3', fontSize: 13.5, color: '#08090A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.seconds}</td>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3' }}><StatusTag tone={p.tone}>{p.status}</StatusTag></td>
                <td style={{ padding: '13px 20px', borderBottom: '1px solid #EDF0F3', textAlign: 'right' }}>
                  <button onClick={() => onRemove(p.id)} title="Remove placement" style={{ border: '1px solid #E1E4E9', borderRadius: 6, background: '#FFFFFF', padding: '5px 9px', fontFamily: 'inherit', fontSize: 12, color: '#CF1322', cursor: 'pointer' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {placementRows.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#08090A' }}>No placements yet</div>
            <div style={{ fontSize: 12.5, color: '#677A90', marginTop: 4 }}>Add a placement above to turn this booking into playback instructions.</div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Step 5 ---------------- */

function Step5({ published, totalScreens, reviewRows, preflight }: {
  published: boolean;
  totalScreens: number;
  reviewRows: { label: string; value: string }[];
  preflight: { label: string; detail: string; glyph: string; color: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {published && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 16px', border: '1px solid #BFE3CD', borderRadius: 8, background: '#F1F9F4' }}>
          <span style={{ fontSize: 13.5, color: '#0F7B3F', fontWeight: 500 }}>Campaign published to the network. Placements are queued for distribution to {totalScreens.toLocaleString('en-US')} screens.</span>
        </div>
      )}
      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Review &amp; Publish</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 32px' }}>
          {reviewRows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: '1px solid #EDF0F3' }}>
              <span style={{ fontSize: 12.5, color: '#677A90' }}>{r.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A', textAlign: 'right' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card padding="20px 24px">
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Pre-flight checks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {preflight.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: '1px solid #E7EBF0', borderRadius: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 1000, background: c.color, color: '#FFFFFF', fontSize: 12, fontWeight: 700, flex: '0 0 auto' }}>{c.glyph}</span>
              <span style={{ flex: '1 1 auto', fontSize: 13, color: '#08090A' }}>{c.label}</span>
              <span style={{ fontSize: 12.5, color: '#677A90' }}>{c.detail}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
