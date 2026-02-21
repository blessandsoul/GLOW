import type { Metadata } from 'next';
import { BrandingSetup } from '@/features/branding/components/BrandingSetup';

export const metadata: Metadata = {
    title: 'Branding — Glow.GE',
};

export default function BrandingPage(): React.ReactElement {
    return (
        <div className="container mx-auto max-w-5xl px-4 py-10">
            <BrandingSetup />
        </div>
    );
}
