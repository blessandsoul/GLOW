import type { Metadata } from 'next';
import { ReferralDashboard } from '@/features/referrals/components/ReferralDashboard';

export const metadata: Metadata = {
  title: 'რეფერალური პროგრამა',
};

export default function ReferralsPage(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <ReferralDashboard />
    </div>
  );
}
