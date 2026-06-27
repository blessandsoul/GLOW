import type { Metadata } from 'next';
import { JoinWaitlistForm } from '@/features/waitlist/components/JoinWaitlistForm';

export const metadata: Metadata = {
    title: 'მოლოდინის სია',
    description: 'ჩაეწერეთ მოლოდინის სიაში და მიიღეთ შეტყობინება, როცა ადგილი გათავისუფლდება.',
};

export default async function WaitlistJoinPage({
    params,
}: {
    params: Promise<{ username: string }>;
}): Promise<React.ReactElement> {
    const { username } = await params;

    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
            <JoinWaitlistForm username={username} />
        </main>
    );
}
