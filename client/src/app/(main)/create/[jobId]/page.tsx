import { StudioWorkspace } from '@/features/upload/components/StudioWorkspace';
import { ResultsPageClient } from '@/features/upload/components/ResultsPageClient';

interface CreateResultPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function CreateResultPage({ params }: CreateResultPageProps): Promise<React.ReactElement> {
    const { jobId } = await params;
    return (
        <StudioWorkspace>
            <ResultsPageClient jobId={jobId} />
        </StudioWorkspace>
    );
}
