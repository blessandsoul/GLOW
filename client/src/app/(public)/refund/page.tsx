import type { Metadata } from 'next';
import { LegalPageContent } from '@/features/legal/components/LegalPageContent';

export const metadata: Metadata = {
  title: 'Refund Policy — Glow.GE',
  description: 'Refund Policy for Glow.GE platform',
};

export default function RefundPage(): React.ReactElement {
  return <LegalPageContent pageType="refund" />;
}
