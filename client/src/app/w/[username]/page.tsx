import type { Metadata } from 'next';
import { BookingFlow } from '@/features/booking/components/BookingFlow';

export const metadata: Metadata = {
    title: 'ონლაინ ჯავშანი',
    description: 'აირჩიეთ სერვისი, თარიღი და თავისუფალი დრო და დაჯავშნეთ ვიზიტი.',
};

export default async function BookingPage({
    params,
    searchParams,
}: {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ waitlist?: string }>;
}): Promise<React.ReactElement> {
    const { username } = await params;
    const { waitlist } = await searchParams;

    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
            <BookingFlow username={username} initialWaitlist={waitlist === '1'} />
        </main>
    );
}
