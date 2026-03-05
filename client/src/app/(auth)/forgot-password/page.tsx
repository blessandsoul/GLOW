import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Recover password',
};

export default function ForgotPasswordPage(): React.ReactElement {
    return <ForgotPasswordForm />;
}
