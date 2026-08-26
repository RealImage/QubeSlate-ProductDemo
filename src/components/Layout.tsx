import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { useAppState } from '../state/AppStateContext';

export function Layout() {
  const { onMainEnter } = useAppState();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F8FA', fontFamily: "Commissioner, system-ui, sans-serif" }}>
      <AppSidebar />
      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main onMouseEnter={onMainEnter} style={{ flex: '1 1 auto', overflowY: 'auto', padding: '28px 28px 64px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
