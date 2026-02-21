import { ShowcaseView } from '@/features/showcase/components/ShowcaseView';

interface ShowcasePageProps {
    params: Promise<{ jobId: string }>;
}

export default async function ShowcasePage({ params }: ShowcasePageProps): Promise<React.ReactElement> {
    const { jobId } = await params;

    return <ShowcaseView jobId={jobId} />;
}
