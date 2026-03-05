import type { Metadata } from 'next';
import { LegalPageContent } from '@/features/legal/components/LegalPageContent';

export const metadata: Metadata = {
  title: 'Privacy Policy — Glow.GE',
  description: 'Privacy Policy for Glow.GE platform',
};

export default function PrivacyPage(): React.ReactElement {
  return <LegalPageContent pageType="privacy" />;
}
