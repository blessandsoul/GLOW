import type { Metadata } from 'next';
import { ModelJoinForm } from '@/features/faces/components/ModelJoinForm';

export const metadata: Metadata = {
    title: 'გახდი მოდელი',
    robots: { index: false, follow: false },
};

export default function FacesJoinPage(): React.ReactElement {
    return (
        <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
            <ModelJoinForm />
        </main>
    );
}
