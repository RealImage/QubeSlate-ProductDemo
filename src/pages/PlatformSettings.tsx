import { useAppState } from '../state/AppStateContext';
import { Card, PageHeader } from '../components/ui/primitives';

export function PlatformSettings() {
  const { state, patch } = useAppState();
  const settings = state.settings;

  const setField = (field: keyof typeof settings, value: string | boolean) =>
    patch(s => ({ settings: { ...s.settings, [field]: value } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820 }}>
      <PageHeader title="Platform Settings" description="Time zones, default rates, content formats and network settings." />
      <Card padding="20px 24px" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>Scheduling time zone</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Playback windows and proof-of-play timestamps use this zone.</span>
          </span>
          <select
            value={settings.timezone}
            onChange={e => setField('timezone', e.target.value)}
            style={{ flex: '0 0 260px', height: 36, padding: '0 10px', border: '1px solid var(--border-default-subtle)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--text-default)', background: 'var(--surface-white)', outline: 'none' }}
          >
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="America/Toronto">America/Toronto</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
        <div style={{ height: 1, background: 'var(--bg-surface-subtle)' }} />
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>Default playlist pack</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Applied to new placements unless overridden.</span>
          </span>
          <select
            value={settings.defaultPack}
            onChange={e => setField('defaultPack', e.target.value)}
            style={{ flex: '0 0 260px', height: 36, padding: '0 10px', border: '1px solid var(--border-default-subtle)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--text-default)', background: 'var(--surface-white)', outline: 'none' }}
          >
            <option value="Pre Show">Pre Show</option>
            <option value="Intermission">Intermission</option>
          </select>
        </label>
        <div style={{ height: 1, background: 'var(--bg-surface-subtle)' }} />
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>Inventory hold on publish</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Hours a booking holds seconds before release.</span>
          </span>
          <input
            type="number" value={settings.holdHours}
            onChange={e => setField('holdHours', e.target.value)}
            style={{ flex: '0 0 120px', height: 36, padding: '0 12px', border: '1px solid var(--border-default-subtle)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--text-default)', textAlign: 'right', outline: 'none' }}
          />
        </label>
        <div style={{ height: 1, background: 'var(--bg-surface-subtle)' }} />
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, cursor: 'pointer' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>Auto-approve renewals</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Repeat bookings from existing clients skip the approval queue.</span>
          </span>
          <input
            type="checkbox" checked={settings.autoApprove}
            onChange={e => setField('autoApprove', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--fill-product)', cursor: 'pointer' }}
          />
        </label>
      </Card>
    </div>
  );
}
