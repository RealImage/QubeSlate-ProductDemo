import { navDef } from '../data/mockData';
import { useAppState } from '../state/AppStateContext';
import { Icon } from './Icon';
import QubeLogo from '../assets/QubeLogoOnlyBlueIcon.svg';

export function AppSidebar() {
  const { state, route, navigateTo, onNavGroup } = useAppState();
  const { collapsed } = state;
  const sidebarWidth = collapsed ? '64px' : '248px';
  const labelDisplay = collapsed ? 'none' : 'flex';

  return (
    <nav style={{ width: sidebarWidth, flex: '0 0 auto', background: '#FFFFFF', borderRight: '1px solid #E1E4E9', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width .15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid #E1E4E9', minHeight: 65 }}>
        <img src={QubeLogo} alt="Qube" style={{ width: 26, height: 26, flex: '0 0 auto' }} />
        <div style={{ display: labelDisplay, flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: '#08090A', whiteSpace: 'nowrap' }}>Qube Slate</div>
          <div style={{ fontSize: 11, color: '#677A90', whiteSpace: 'nowrap' }}>Campaign Manager</div>
        </div>
      </div>

      <div style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px 24px' }}>
        {navDef.map(g => {
          const isLeafActive = !!g.items && g.items.some(i => i.route === route);
          const active = g.route === route;
          const expanded = !collapsed && !!g.items && state.open.indexOf(g.key) >= 0;
          const bg = active ? '#E8F0F8' : (isLeafActive ? '#F5F8FA' : 'transparent');
          const color = active || isLeafActive ? '#084782' : '#4A5A6C';
          const weight = active || isLeafActive ? 600 : 500;

          return (
            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 1 }}>
              <button
                title={g.title}
                onClick={() => onNavGroup(g.key, g.route)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
                  border: 0, borderRadius: 6, background: bg, color, fontFamily: 'inherit',
                  fontSize: 13.5, fontWeight: weight, textAlign: 'left', cursor: 'pointer', lineHeight: '20px'
                }}
              >
                <Icon name={g.icon} size={22} />
                <span style={{ display: labelDisplay, flex: '1 1 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</span>
                {g.items && !collapsed && (
                  <Icon
                    name="ChevronRight"
                    size={18}
                    color="#97A5B5"
                    style={{ transform: `rotate(${expanded ? '90deg' : '0deg'})`, transition: 'transform .15s' }}
                  />
                )}
              </button>
              {expanded && g.items && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '2px 0 6px 15px', marginLeft: 8, borderLeft: '1px solid #E7EBF0' }}>
                  {g.items.map(it => {
                    const itActive = it.route === route;
                    return (
                      <button
                        key={it.route}
                        onClick={() => navigateTo(it.route)}
                        style={{
                          display: 'block', width: '100%', padding: '7px 10px', border: 0, borderRadius: 6,
                          background: itActive ? '#084782' : 'transparent', color: itActive ? '#FFFFFF' : '#4A5A6C',
                          fontFamily: 'inherit', fontSize: 13, fontWeight: itActive ? 600 : 400,
                          textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}
                      >
                        {it.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
