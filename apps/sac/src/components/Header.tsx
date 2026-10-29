import { routeTitles } from '../data/mockData';
import { useAppState } from '../state/AppStateContext';
import { Icon } from './Icon';

export function Header() {
  const { route, toggleSidebar } = useAppState();
  const crumbs = routeTitles[route] || ['Qube Slate', 'Screen', ''];
  const [crumbGroup, crumbLeaf] = crumbs;

  return (
    <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', height: 65, background: 'var(--surface-white)', borderBottom: '1px solid var(--border-default-alt)' }}>
      <button
        onClick={toggleSidebar}
        title="Toggle navigation"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid var(--border-default-alt)', borderRadius: 6, background: 'var(--surface-white)', cursor: 'pointer', flex: '0 0 auto' }}
      >
        <Icon name="Hamburger" size={20} color="var(--grey-600)" />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', minWidth: 0 }}>
        <span>Qube Slate</span>
        <span style={{ color: 'var(--grey-200)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{crumbGroup}</span>
        <span style={{ color: 'var(--grey-200)' }}>/</span>
        <span style={{ color: 'var(--text-default)', fontWeight: 500 }}>{crumbLeaf}</span>
      </div>
      <div style={{ flex: '1 1 auto' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px 5px 6px', border: '1px solid var(--border-default-alt)', borderRadius: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 1000, background: 'var(--fill-product)', color: 'var(--text-white)', fontSize: 11, fontWeight: 600, letterSpacing: '.02em' }}>RD</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-default)' }}>Riya Deshpande</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>Ad Operations · QCN</span>
        </div>
      </div>
    </header>
  );
}
