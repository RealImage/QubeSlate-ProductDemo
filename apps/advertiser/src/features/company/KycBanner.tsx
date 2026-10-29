import { Link } from 'react-router-dom';
import { Alert } from '@slate/ui';
import { date, type Company, type Sac } from '@slate/domain';
import { useCompany, useOrg } from '../../components/org';

export const KYC_LABEL: Record<Company['kycStatus'], string> = {
  draft: 'Not submitted',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected'
};

/** Copy for the KYC status alert, shared by the app-wide banner and the Company Information page. */
export function kycAlert(company: Company, sac: Pick<Sac, 'name'>): { variant: 'notice' | 'negative'; title: string; body: string } | null {
  switch (company.kycStatus) {
    case 'approved':
      return null;
    case 'pending':
      return {
        variant: 'notice',
        title: 'KYC verification in progress',
        body: `Your company profile was submitted on ${date(company.kycSubmittedAt)} and is being reviewed by ${sac.name}. You can build campaigns, upload media and manage users meanwhile — checkout stays locked until approval.`
      };
    case 'rejected':
      return {
        variant: 'negative',
        title: 'KYC needs changes',
        body: `${sac.name} returned your KYC${company.kycNote ? `: “${company.kycNote}”` : '.'} Replace the flagged documents and submit again. Checkout stays locked until approval.`
      };
    case 'draft':
      return {
        variant: 'notice',
        title: 'Complete your company KYC',
        body: `Upload your KYC documents and submit them to ${sac.name} for review. You can plan campaigns meanwhile — checkout stays locked until approval.`
      };
  }
}

/** App-wide banner shown while the company is not KYC approved. */
export function KycBanner() {
  const { sac } = useOrg();
  const { data: company } = useCompany();
  const a = kycAlert(company, sac);
  if (!a) return null;
  return (
    <div className="adv-banner">
      <Alert variant={a.variant} title={a.title} closable={false}>
        {a.body}{' '}
        {company.kycStatus !== 'pending' && <Link to="/company">Go to Company Information</Link>}
      </Alert>
    </div>
  );
}
