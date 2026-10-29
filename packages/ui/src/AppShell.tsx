import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sidebar, SidebarMobileHeader, Button } from 'prefab';
import { LogoutIcon } from 'prefab/icons';
import { ROLE_LABEL } from '@slate/domain';
import { useSession, sessionStore } from '@slate/api';
import { DevAccountSwitcher } from './SignIn';
import slateLogo from '../assets/QubeSlate.svg';
import slateMark from '../assets/QubeLogoOnlyBlueIcon.svg';

export interface NavLeaf { label: string; to: string; icon?: ReactNode; /** Extra path prefixes that keep this item active. */ match?: string[] }
export interface NavGroupDef { label: string; icon: ReactNode; items: NavLeaf[] }
export type NavEntry = NavLeaf | NavGroupDef;

const isGroup = (e: NavEntry): e is NavGroupDef => 'items' in e;

function isActive(leaf: NavLeaf, pathname: string) {
  const prefixes = [leaf.to, ...(leaf.match ?? [])];
  return prefixes.some(p => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')));
}

/**
 * Persistent left sidebar + top bar shared by every portal.
 * `portalLabel` sits beside the wordmark (ADVERTISER / SAC / ADMIN); `orgName` and `orgMeta` describe who is signed in.
 */
export function AppShell({ nav, portalLabel, orgName, orgMeta, topbarExtra }: {
  nav: NavEntry[];
  portalLabel: string;
  orgName: ReactNode;
  orgMeta?: ReactNode;
  topbarExtra?: ReactNode;
}) {
  const { pathname } = useLocation();
  const { session, signOut, portal } = useSession();
  const [open, setOpen] = useState(true);
  const stored = sessionStore.get(portal);

  const leaf = (l: NavLeaf) => (
    <Sidebar.NavItem key={l.to} isActive={isActive(l, pathname)}>
      <Link to={l.to}>{l.icon}<Sidebar.Label>{l.label}</Sidebar.Label></Link>
    </Sidebar.NavItem>
  );

  return (
    <div className="sl-shell">
      <SidebarMobileHeader open={open} onOpenChange={setOpen}><img src={slateLogo} alt="Qube Slate" height={24} /></SidebarMobileHeader>
      <Sidebar open={open} onOpenChange={setOpen}>
        <Sidebar.Header>
          {({ collapsed }) => collapsed
            ? <img src={slateMark} alt="Qube Slate" width={28} />
            : <span className="sl-brandmark"><img src={slateLogo} alt="Qube Slate" height={24} /><small>{portalLabel}</small></span>}
        </Sidebar.Header>
        <Sidebar.Nav>
          {nav.map(e => isGroup(e)
            ? <Sidebar.NavGroup key={e.label} label={e.label} icon={e.icon} isActive={e.items.some(i => isActive(i, pathname))}>{e.items.map(leaf)}</Sidebar.NavGroup>
            : leaf(e))}
        </Sidebar.Nav>
        <Sidebar.Footer>
          {session && <Sidebar.User name={session.user.name} subtitle={ROLE_LABEL[session.user.role]} />}
          <Sidebar.Actions>
            <Sidebar.Button aria-label="Sign out" onPress={signOut}><LogoutIcon /></Sidebar.Button>
          </Sidebar.Actions>
        </Sidebar.Footer>
      </Sidebar>
      <div className="sl-shell__main">
        {session?.impersonator && (
          <div className="sl-impersonation" role="status">
            <strong>Support session</strong>
            {session.impersonator.name} is acting as {session.user.name}. Every action is recorded in the audit log.
            <Button size="small" variant="default" onPress={() => { sessionStore.set(portal, null); window.close(); signOut(); }}>End session</Button>
          </div>
        )}
        <header className="sl-topbar">
          <div className="sl-topbar__org"><strong>{orgName}</strong>{orgMeta && <span>{orgMeta}</span>}</div>
          <div className="sl-topbar__spacer" />
          {topbarExtra}
          {import.meta.env.DEV && !stored?.impersonatorId && <DevAccountSwitcher />}
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}

/** Standard page body: padding, max width, vertical rhythm. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="sl-page">{children}</div>;
}
