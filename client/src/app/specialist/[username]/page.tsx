import { PublicPortfolio } from '@/features/portfolio/components/PublicPortfolio';

interface PortfolioPublicPageProps {
    params: Promise<{ username: string }>;
}

export default async function PortfolioPublicPage({ params }: PortfolioPublicPageProps): Promise<React.ReactElement> {
    const { username } = await params;

    return <PublicPortfolio username={username} />;
}
