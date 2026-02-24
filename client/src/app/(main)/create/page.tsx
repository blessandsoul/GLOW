import type { Metadata } from 'next';
import { StudioWorkspace } from '@/features/upload/components/StudioWorkspace';

export const metadata: Metadata = {
    title: 'Create - Glow.GE',
    description: 'AI-powered photo enhancement studio for beauty professionals',
};

export default function CreatePage(): React.ReactElement {
    return <StudioWorkspace />;
}
