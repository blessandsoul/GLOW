import { Suspense } from 'react';
import { VerifyPhoneForm } from '@/features/auth/components/VerifyPhoneForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Verify Phone',
};

export default function VerifyPhonePage(): React.ReactElement {
    return (
        <Suspense>
            <VerifyPhoneForm />
        </Suspense>
    );
}
