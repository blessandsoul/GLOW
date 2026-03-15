import type { Metadata } from 'next';

import { PublicPortfolio } from '@/features/portfolio/components/PublicPortfolio';
import type { PublicPortfolioData } from '@/features/portfolio/types/portfolio.types';
import type { ApiResponse } from '@/lib/api/api.types';

interface PortfolioPublicPageProps {
    params: Promise<{ username: string }>;
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

async function fetchPortfolio(username: string): Promise<PublicPortfolioData | null> {
    try {
        const res = await fetch(`${API_BASE}/portfolio/public/${username}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = (await res.json()) as ApiResponse<PublicPortfolioData>;
        return json.data;
    } catch {
        return null;
    }
}

function getFullImageUrl(path: string | null): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    try {
        return `${new URL(API_BASE).origin}${path}`;
    } catch {
        return undefined;
    }
}

export async function generateMetadata({ params }: PortfolioPublicPageProps): Promise<Metadata> {
    const { username } = await params;
    const portfolio = await fetchPortfolio(username);

    if (!portfolio) {
        return { title: 'Specialist' };
    }

    const title = portfolio.displayName;
    const description = [
        portfolio.niche,
        portfolio.city,
        portfolio.averageRating > 0
            ? `★ ${portfolio.averageRating.toFixed(1)} (${portfolio.reviewsCount})`
            : null,
        portfolio.services.length > 0
            ? `${portfolio.services.length} services`
            : null,
    ]
        .filter(Boolean)
        .join(' · ') || 'Beauty specialist on Glow.GE';

    const avatarUrl = getFullImageUrl(portfolio.avatar);

    const ogImages = portfolio.items
        .filter((item) => item.isPublished && item.imageUrl)
        .slice(0, 4)
        .map((item) => getFullImageUrl(item.imageUrl))
        .filter((url): url is string => !!url);

    return {
        title,
        description,
        openGraph: {
            type: 'profile',
            title: `${title} | Glow.GE`,
            description,
            url: `https://glow.ge/specialist/${username}`,
            images: ogImages.length > 0
                ? ogImages.map((url) => ({ url, width: 800, height: 800 }))
                : avatarUrl
                    ? [{ url: avatarUrl, width: 400, height: 400 }]
                    : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | Glow.GE`,
            description,
        },
    };
}

export default async function PortfolioPublicPage({ params }: PortfolioPublicPageProps): Promise<React.ReactElement> {
    const { username } = await params;

    return <PublicPortfolio username={username} />;
}
