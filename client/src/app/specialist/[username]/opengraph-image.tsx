import { ImageResponse } from 'next/og';

export const alt = 'Specialist on Glow.GE';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

function getOrigin(): string {
    try {
        return new URL(API_BASE).origin;
    } catch {
        return 'http://localhost:4000';
    }
}

function fullUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${getOrigin()}${path}`;
}

interface PortfolioResponse {
    success: boolean;
    data: {
        displayName: string;
        avatar: string | null;
        bio: string | null;
        city: string | null;
        niche: string | null;
        averageRating: number;
        reviewsCount: number;
        services: { name: string }[];
        items: { imageUrl: string; isPublished: boolean }[];
    };
}

async function fetchPortfolio(username: string): Promise<PortfolioResponse['data'] | null> {
    try {
        const res = await fetch(`${API_BASE}/portfolio/public/${username}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = (await res.json()) as PortfolioResponse;
        return json.data;
    } catch {
        return null;
    }
}

function RatingDots({ rating }: { rating: number }): React.ReactElement {
    const full = Math.round(rating);
    const dots: React.ReactElement[] = [];
    for (let i = 0; i < 5; i++) {
        dots.push(
            <div
                key={i}
                style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: i < full ? '#F0C060' : '#E5E5EA',
                }}
            />,
        );
    }
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            {dots}
        </div>
    );
}

export default async function OGImage({
    params,
}: {
    params: Promise<{ username: string }>;
}): Promise<ImageResponse> {
    const { username } = await params;
    const portfolio = await fetchPortfolio(username);

    if (!portfolio) {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FAFAF8',
                        fontSize: '32px',
                        color: '#666',
                    }}
                >
                    Specialist not found
                </div>
            ),
            { ...size },
        );
    }

    const avatarUrl = fullUrl(portfolio.avatar);
    const photos = portfolio.items
        .filter((i) => i.isPublished && i.imageUrl)
        .slice(0, 3)
        .map((i) => fullUrl(i.imageUrl))
        .filter((u): u is string => !!u);

    const subtitleParts = [portfolio.niche, portfolio.city].filter(Boolean);
    const publishedCount = portfolio.items.filter((i) => i.isPublished).length;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    background: '#FAFAF8',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Left panel */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '56px 48px',
                        width: photos.length > 0 ? '480px' : '100%',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Avatar */}
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            width={96}
                            height={96}
                            style={{
                                width: '96px',
                                height: '96px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid rgba(180,144,245,0.3)',
                                marginBottom: '20px',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '96px',
                                height: '96px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #B490F5 0%, #D7A4CC 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                                fontSize: '40px',
                                fontWeight: 700,
                                color: '#fff',
                            }}
                        >
                            {portfolio.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Name */}
                    <div
                        style={{
                            display: 'flex',
                            fontSize: '36px',
                            fontWeight: 800,
                            color: '#1C1C1E',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.1,
                            marginBottom: '8px',
                        }}
                    >
                        {portfolio.displayName}
                    </div>

                    {/* Subtitle */}
                    {subtitleParts.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '18px',
                                fontWeight: 500,
                                color: '#8E8E93',
                                marginBottom: '16px',
                            }}
                        >
                            {subtitleParts.join(' / ')}
                        </div>
                    )}

                    {/* Rating */}
                    {portfolio.averageRating > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '20px',
                            }}
                        >
                            <RatingDots rating={portfolio.averageRating} />
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '16px',
                                    color: '#8E8E93',
                                    fontWeight: 500,
                                }}
                            >
                                {portfolio.averageRating.toFixed(1)} ({portfolio.reviewsCount})
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    {(portfolio.services.length > 0 || publishedCount > 0) && (
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '15px',
                                color: '#AEAEB2',
                                fontWeight: 500,
                            }}
                        >
                            {portfolio.services.length > 0 ? `${portfolio.services.length} services` : ''}
                            {portfolio.services.length > 0 && publishedCount > 0 ? ' / ' : ''}
                            {publishedCount > 0 ? `${publishedCount} photos` : ''}
                        </div>
                    )}

                    {/* Brand */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            marginTop: 'auto',
                            paddingTop: '24px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '22px',
                                fontWeight: 900,
                                color: '#1C1C1E',
                                letterSpacing: '-0.03em',
                            }}
                        >
                            GLOW
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#B490F5',
                                marginLeft: '2px',
                                marginBottom: '6px',
                            }}
                        >
                            .GE
                        </div>
                    </div>
                </div>

                {/* Right panel — portfolio photos */}
                {photos.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flex: 1,
                            gap: '8px',
                            padding: '32px 32px 32px 0',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {/* Main large photo */}
                        <div
                            style={{
                                display: 'flex',
                                flex: 2,
                                borderRadius: '16px',
                                overflow: 'hidden',
                            }}
                        >
                            <img
                                src={photos[0]}
                                width={460}
                                height={566}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>

                        {/* Secondary photos stacked */}
                        {photos.length > 1 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1,
                                    gap: '8px',
                                }}
                            >
                                {photos.slice(1, 3).map((url, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            flex: 1,
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <img
                                            src={url}
                                            width={230}
                                            height={275}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom accent line */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        height: '4px',
                        background:
                            'linear-gradient(90deg, #B490F5 0%, #D7A4CC 40%, #F0C060 100%)',
                    }}
                />
            </div>
        ),
        { ...size },
    );
}
