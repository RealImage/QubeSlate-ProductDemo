import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ROLE_LABEL } from '@slate/domain';
import { sessionApi, useSession } from '@slate/api';
import { Avatar, Loading } from './components';
import slateLogo from '../assets/QubeSlate.svg';

/**
 * Mock sign-in. Lists the seeded accounts for this portal. Real SSO replaces this screen;
 * the rest of the app only depends on useSession().
 */
export function SignInPage({ headline, footnote, children }: { headline: ReactNode; footnote?: ReactNode; children?: ReactNode }) {
  const { portal, signIn } = useSession();
  const accounts = useQuery({ queryKey: ['demo-accounts'], queryFn: sessionApi.demoAccounts });
  const mine = (accounts.data ?? []).filter(a => a.user.portal === portal);
  return (
    <div className="sl-signin">
      <div className="sl-signin__hero">
        <img src={slateLogo} alt="Qube Slate" height={28} style={{ filter: 'brightness(0) invert(1)', alignSelf: 'flex-start' }} />
        <h1>{headline}</h1>
        <p style={{ margin: 0, opacity: 0.75, fontSize: 13 }}>Qube Slate · cinema and DOOH advertising</p>
      </div>
      <div className="sl-signin__panel">
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Sign in</h2>
          <p className="sl-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>Prototype sign-in — pick a seeded account. Single sign-on replaces this step.</p>
        </div>
        {accounts.isLoading ? <Loading /> : accounts.error ? (
          <p className="sl-muted">The mock API isn’t running. Start it with <code>npm run dev:api</code>.</p>
        ) : (
          <div className="sl-stack" style={{ gap: 8 }}>
            {mine.map(a => (
              <button key={a.user.id} type="button" className="sl-account" onClick={() => signIn(a.user.id)}>
                <Avatar name={a.user.name} />
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <strong style={{ fontSize: 13.5 }}>{a.user.name}</strong>
                  <span className="sl-muted sl-small">{ROLE_LABEL[a.user.role]} · {a.orgName}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {children}
        {footnote && <p className="sl-muted sl-small" style={{ margin: 0 }}>{footnote}</p>}
      </div>
    </div>
  );
}

/** Dev-only switcher in the top bar, like the design's "Prototype · account state" control. */
export function DevAccountSwitcher() {
  const { portal, session, signIn } = useSession();
  const accounts = useQuery({ queryKey: ['demo-accounts'], queryFn: sessionApi.demoAccounts });
  const mine = (accounts.data ?? []).filter(a => a.user.portal === portal);
  if (!mine.length) return null;
  return (
    <label className="sl-devswitch">
      PROTOTYPE · ACCOUNT
      <select value={session?.user.id ?? ''} onChange={e => signIn(e.target.value)} aria-label="Switch demo account">
        {mine.map(a => <option key={a.user.id} value={a.user.id}>{a.user.name} — {ROLE_LABEL[a.user.role]}, {a.orgName}</option>)}
      </select>
    </label>
  );
}

/** Gate: renders the sign-in page until a session for this portal exists. */
export function RequireSession({ signIn, children }: { signIn: ReactNode; children: ReactNode }) {
  const { session, loading } = useSession();
  if (loading) return <Loading rows={6} />;
  return <>{session ? children : signIn}</>;
}
