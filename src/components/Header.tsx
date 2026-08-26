import { routeTitles } from '../data/mockData';
import { useAppState } from '../state/AppStateContext';
import { Icon } from './Icon';

export function Header() {
  const { route, toggleSidebar } = useAppState();
  const crumbs = routeTitles[route] || ['Qube Slate', 'Screen', ''];
  const [crumbGroup, crumbLeaf] = crumbs;

  return (
    <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', height: 65, background: '#FFFFFF', borderBottom: '1px solid #E1E4E9' }}>
      <button
        onClick={toggleSidebar}
        title="Toggle navigation"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid #E1E4E9', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', flex: '0 0 auto' }}
      >
        <Icon name="Hamburger" size={20} color="#4A5A6C" />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#677A90', minWidth: 0 }}>
        <span>Qube Slate</span>
        <span style={{ color: '#C3CCD6' }}>/</span>
        <span style={{ color: '#677A90' }}>{crumbGroup}</span>
        <span style={{ color: '#C3CCD6' }}>/</span>
        <span style={{ color: '#08090A', fontWeight: 500 }}>{crumbLeaf}</span>
      </div>
      <div style={{ flex: '1 1 auto' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px 5px 6px', border: '1px solid #E1E4E9', borderRadius: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 1000, background: '#084782', color: '#FFFFFF', fontSize: 11, fontWeight: 600, letterSpacing: '.02em' }}>RD</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: '#08090A' }}>Riya Deshpande</span>
          <span style={{ fontSize: 10.5, color: '#677A90' }}>Ad Operations · QCN</span>
        </div>
      </div>
    </header>
  );
}
