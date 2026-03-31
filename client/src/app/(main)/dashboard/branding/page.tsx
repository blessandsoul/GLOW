import type { Metadata } from 'next';
import { BrandingSetup } from '@/features/branding/components/BrandingSetup';

export const metadata: Metadata = {
    title: 'Branding',
};

export default function BrandingPage(): React.ReactElement {
    return (
        <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
            <BrandingSetup />
        </div>
    );
}
