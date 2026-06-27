import type { Metadata } from 'next';
import { BookingFlow } from '@/features/booking/components/BookingFlow';

export const metadata: Metadata = {
    title: 'ონლაინ ჯავშანი',
    description: 'აირჩიეთ სერვისი, თარიღი და თავისუფალი დრო და დაჯავშნეთ ვიზიტი.',
};

export default async function BookingPage({
    params,
}: {
    params: Promise<{ username: string }>;
}): Promise<React.ReactElement> {
    const { username } = await params;

    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
            <BookingFlow username={username} />
        </main>
    );
}
