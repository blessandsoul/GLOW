import { redirect } from 'next/navigation';

interface ReferralPageProps {
  params: Promise<{ code: string }>;
}

export default async function ReferralLandingPage({ params }: ReferralPageProps): Promise<never> {
  const { code } = await params;
  redirect(`/register?ref=${code}`);
}
