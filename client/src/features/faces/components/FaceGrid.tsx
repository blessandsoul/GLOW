'use client';

import { FaceCard } from './FaceCard';
import type { ModelCard } from '../types/faces.types';

interface FaceGridProps {
    models: ModelCard[];
    likedMap: Record<string, boolean>;
}

export function FaceGrid({ models, likedMap }: FaceGridProps): React.ReactElement {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {models.map((model) => (
                <FaceCard key={model.id} model={model} liked={!!likedMap[model.id]} />
            ))}
        </div>
    );
}
