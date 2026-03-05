import type { Metadata } from 'next';
import { LegalPageContent } from '@/features/legal/components/LegalPageContent';

export const metadata: Metadata = {
  title: 'Terms of Service — Glow.GE',
  description: 'Terms of Service for Glow.GE platform',
};

export default function TermsPage(): React.ReactElement {
  return <LegalPageContent pageType="terms" />;
}
