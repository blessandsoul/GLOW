import { LoginForm } from '@/features/auth/components/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'system.sys_4a6zcn',
};

export default function LoginPage(): React.ReactElement {
    return <LoginForm />;
}
