import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sidebar, SidebarMobileHeader, Button, Menu } from 'prefab';
import { LogoutIcon } from 'prefab/icons';
import { contrastText, ROLE_LABEL, type SacBranding } from '@slate/domain';
import { useSession, sessionStore } from '@slate/api';
import { DevAccountSwitcher } from './SignIn';
import { useThemePreference, type ThemePreference } from './theme';
import slateLogo from '../assets/QubeSlate.svg';
import slateMark from '../assets/QubeLogoOnlyBlueIcon.svg';

/** `icon` shows on top-level items only; items inside a group are text, like the rest of the Qube products. */
export interface NavLeaf {
  label: string; to: string; icon?: ReactNode;
  /** Extra path prefixes that keep this item active. */ match?: string[];
  /** Items waiting on the user; shown as a badge when above zero. */ count?: number;
}
export interface NavGroupDef { label: string; icon: ReactNode; items: NavLeaf[] }
export type NavEntry = NavLeaf | NavGroupDef;

const isGroup = (e: NavEntry): e is NavGroupDef => 'items' in e;

/** Length of the longest path prefix of this leaf that matches, or -1. */
function matchLength(leaf: NavLeaf, pathname: string) {
  const prefixes = [leaf.to, ...(leaf.match ?? [])];
  return Math.max(-1, ...prefixes.filter(p => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/'))).map(p => p.length));
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const THEME_ICON: Record<ThemePreference, ReactNode> = {
  light: <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  dark: <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke}><path d="M20.5 14.5A8.5 8.5 0 019.5 3.5a8.5 8.5 0 1011 11z" /></svg>,
  system: <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
};
const THEME_LABEL: Record<ThemePreference, string> = { light: 'Light', dark: 'Dark', system: 'System' };

/** Light / Dark / System, remembered per browser. */
function ThemeMenu() {
  const [pref, setPref] = useThemePreference();
  return (
    <Menu>
      <Sidebar.Button aria-label={`Theme: ${THEME_LABEL[pref]}`}>{THEME_ICON[pref]}</Sidebar.Button>
      <Menu.Items placement="top start" selectionMode="single" selectedKeys={[pref]} disallowEmptySelection
        onSelectionChange={keys => { const k = [...(keys as Set<ThemePreference>)][0]; if (k) setPref(k); }}>
        {(['light', 'dark', 'system'] as const).map(t => (
          <Menu.Item key={t} id={t} textValue={THEME_LABEL[t]}>
            {({ isSelected }) => <span className="sl-thememenu__item">{THEME_ICON[t]}{THEME_LABEL[t]}{isSelected && <span className="sl-thememenu__check" aria-hidden="true">✓</span>}</span>}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
}

/**
 * prefab's NavGroup label is plain text, so a group's total is drawn by CSS from a counter (see .sl-navgroup) and shows
 * only while the group is closed. TODO(prefab-ui): accept a badge on NavGroup and drop this wrapper.
 */
function NavGroup({ group, isActive, children }: { group: NavGroupDef; isActive: boolean; children: ReactNode }) {
  const total = group.items.reduce((n, i) => n + (i.count ?? 0), 0);
  // The wrapper stays mounted whatever the total, so a count change never remounts the group (and drops focus inside it).
  return (
    <div className={total ? 'sl-navgroup sl-navgroup--count' : 'sl-navgroup'} style={{ '--sl-navgroup-count': total } as CSSProperties}>
      <Sidebar.NavGroup label={group.label} icon={group.icon} isActive={isActive}>{children}</Sidebar.NavGroup>
    </div>
  );
}

/**
 * CSS custom properties that restyle a portal for one SAC: header colour on the top bar (black or white text by contrast),
 * primary colour on the brand and product tokens, secondary colour for accents.
 */
export function brandStyle(brand: Pick<SacBranding, 'headerColor' | 'primaryColor' | 'secondaryColor'>): Record<string, string> {
  const { headerColor: header, primaryColor: primary, secondaryColor: secondary } = brand;
  return {
    '--sl-brand': primary, '--fill-product': primary, '--text-product': primary, '--border-product': primary, '--icon-product': primary,
    '--fill-nav-bar-selected': primary, '--sl-active-fill': `color-mix(in srgb, ${primary} 10%, var(--fill-white))`,
    '--sl-secondary': secondary, '--sl-topbar-bg': header, '--sl-topbar-fg': contrastText(header)
  };
}

/** Applies the brand to the document too, so dialogs and menus (rendered in portals outside the shell) match. */
function useBrandOnDocument(vars: Record<string, string> | null) {
  const key = vars ? JSON.stringify(vars) : '';
  useEffect(() => {
    if (!key) return;
    const entries = Object.entries(JSON.parse(key) as Record<string, string>);
    const root = document.documentElement;
    entries.forEach(([k, v]) => root.style.setProperty(k, v));
    return () => entries.forEach(([k]) => root.style.removeProperty(k));
  }, [key]);
}

/**
 * Persistent left sidebar + top bar shared by every portal.
 * `portalLabel` sits beside the wordmark (ADVERTISER / SAC / ADMIN); `orgName` and `orgMeta` describe who is signed in.
 * `brand` restyles the shell with a SAC's colours and logo; `logo` swaps only the logo (null keeps Slate's).
 */
export function AppShell({ nav, portalLabel, orgName, orgMeta, topbarExtra, brand, logo: logoOnly }: {
  nav: NavEntry[];
  portalLabel: string;
  orgName: ReactNode;
  orgMeta?: ReactNode;
  topbarExtra?: ReactNode;
  brand?: SacBranding | null;
  logo?: string | null;
}) {
  const { pathname } = useLocation();
  const { session, signOut, portal } = useSession();
  const [open, setOpen] = useState(true);
  const stored = sessionStore.get(portal);
  const vars = brand ? brandStyle(brand) : null;
  useBrandOnDocument(vars);
  const logo = brand?.logo ?? logoOnly ?? null;
  const logoAlt = logo ? 'SAC logo' : 'Qube Slate';
  // Only the most specific match is active, so /campaigns/rate-bias doesn't also light up /campaigns.
  const leaves = nav.flatMap(e => (isGroup(e) ? e.items : [e]));
  const best = Math.max(-1, ...leaves.map(l => matchLength(l, pathname)));
  const isActive = (l: NavLeaf) => best >= 0 && matchLength(l, pathname) === best;

  const leaf = (l: NavLeaf, nested = false) => (
    <Sidebar.NavItem key={l.to} isActive={isActive(l)}>
      <Link to={l.to}>{!nested && l.icon}<Sidebar.Label>{l.label}</Sidebar.Label>{!!l.count && <span className="sl-navcount" aria-label={`${l.count} waiting`}>{l.count}</span>}</Link>
    </Sidebar.NavItem>
  );

  return (
    <div className="sl-shell" style={vars as CSSProperties | undefined}>
      <SidebarMobileHeader open={open} onOpenChange={setOpen}><img src={logo ?? slateLogo} alt={logoAlt} height={24} className={logo ? 'sl-logo' : 'sl-logo sl-logo--slate'} /></SidebarMobileHeader>
      <Sidebar open={open} onOpenChange={setOpen}>
        <Sidebar.Header>
          {({ collapsed }) => collapsed
            ? <img src={logo ?? slateMark} alt={logoAlt} width={28} className="sl-logo" />
            : <span className="sl-brandmark"><img src={logo ?? slateLogo} alt={logoAlt} height={24} className={logo ? 'sl-logo' : 'sl-logo sl-logo--slate'} /><small>{portalLabel}</small></span>}
        </Sidebar.Header>
        <Sidebar.Nav>
          {nav.map(e => isGroup(e)
            ? <NavGroup key={e.label} group={e} isActive={e.items.some(isActive)}>{e.items.map(i => leaf(i, true))}</NavGroup>
            : leaf(e))}
        </Sidebar.Nav>
        <Sidebar.Footer>
          {session && <Sidebar.User name={session.user.name} subtitle={ROLE_LABEL[session.user.role]} />}
          <Sidebar.Actions>
            <ThemeMenu />
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
        <header className={vars ? 'sl-topbar sl-topbar--branded' : 'sl-topbar'}>
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
