import { Suspense } from 'react';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'რეგისტრაცია',
};

export default function RegisterPage(): React.ReactElement {
    return (
        <Suspense>
            <RegisterForm />
        </Suspense>
    );
}
