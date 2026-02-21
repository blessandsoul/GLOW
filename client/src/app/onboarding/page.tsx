'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';

export default function OnboardingPage(): React.ReactElement {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const onboarded = localStorage.getItem('glowge_onboarded');
            if (onboarded) {
                router.replace('/dashboard');
            }
        }
    }, [router]);

    return (
        <div className="min-h-dvh bg-background flex flex-col">
            {/* No header/footer — focused experience */}
            <div className="flex-1 flex items-center justify-center py-12 px-4">
                <OnboardingWizard />
            </div>
        </div>
    );
}
