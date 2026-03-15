import { ImageResponse } from 'next/og';

export const alt = 'Specialist on Glow.GE';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

const NOTO_SANS_REGULAR =
    'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-400-normal.ttf';
const NOTO_SANS_BOLD =
    'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-700-normal.ttf';
const NOTO_SANS_GEORGIAN =
    'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-georgian@latest/georgian-400-normal.ttf';

async function loadFonts(): Promise<{ name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[]> {
    try {
        const [regular, bold, georgian] = await Promise.all([
            fetch(NOTO_SANS_REGULAR).then((r) => r.arrayBuffer()),
            fetch(NOTO_SANS_BOLD).then((r) => r.arrayBuffer()),
            fetch(NOTO_SANS_GEORGIAN).then((r) => r.arrayBuffer()),
        ]);
        return [
            { name: 'Noto Sans', data: regular, style: 'normal' as const, weight: 400 as const },
            { name: 'Noto Sans', data: bold, style: 'normal' as const, weight: 700 as const },
            { name: 'Noto Sans Georgian', data: georgian, style: 'normal' as const, weight: 400 as const },
        ];
    } catch {
        return [];
    }
}

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

interface PortfolioData {
    displayName: string;
    avatar: string | null;
    bio: string | null;
    city: string | null;
    niche: string | null;
    instagram: string | null;
    whatsapp: string | null;
    telegram: string | null;
    averageRating: number;
    reviewsCount: number;
    services: { name: string; price: number; priceType?: 'fixed' | 'hourly'; startingFrom?: boolean }[];
    items: { imageUrl: string; isPublished: boolean }[];
}

interface PortfolioResponse {
    success: boolean;
    data: PortfolioData;
}

async function fetchPortfolio(username: string): Promise<PortfolioData | null> {
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

function formatPrice(price: number, startingFrom?: boolean): string {
    const formatted = `${price} GEL`;
    return startingFrom ? `${formatted}-დან` : formatted;
}

export default async function OGImage({
    params,
}: {
    params: Promise<{ username: string }>;
}): Promise<ImageResponse> {
    const { username } = await params;
    const [portfolio, fonts] = await Promise.all([
        fetchPortfolio(username),
        loadFonts(),
    ]);

    const fontFamily = 'Noto Sans, Noto Sans Georgian, sans-serif';

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
                        fontFamily,
                        fontSize: '32px',
                        color: '#666',
                    }}
                >
                    Specialist not found
                </div>
            ),
            { ...size, fonts },
        );
    }

    const avatarUrl = fullUrl(portfolio.avatar);
    const photos = portfolio.items
        .filter((i) => i.isPublished && i.imageUrl)
        .slice(0, 3)
        .map((i) => fullUrl(i.imageUrl))
        .filter((u): u is string => !!u);

    const publishedCount = portfolio.items.filter((i) => i.isPublished).length;
    const topServices = portfolio.services.slice(0, 3);

    // Social icons text
    const socials: string[] = [];
    if (portfolio.instagram) socials.push(`@${portfolio.instagram.replace('@', '')}`);
    if (portfolio.telegram) socials.push('Telegram');
    if (portfolio.whatsapp) socials.push('WhatsApp');

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    background: '#FAFAF8',
                    fontFamily,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Left panel */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '40px 44px',
                        width: photos.length > 0 ? '500px' : '100%',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Top row: avatar + name */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '16px',
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                width={72}
                                height={72}
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '3px solid rgba(180,144,245,0.3)',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #B490F5 0%, #D7A4CC 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: '#fff',
                                }}
                            >
                                {portfolio.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '28px',
                                    fontWeight: 700,
                                    color: '#1C1C1E',
                                    lineHeight: 1.2,
                                }}
                            >
                                {portfolio.displayName}
                            </div>
                            {(portfolio.niche || portfolio.city) && (
                                <div
                                    style={{
                                        display: 'flex',
                                        fontSize: '15px',
                                        fontWeight: 400,
                                        color: '#8E8E93',
                                        marginTop: '2px',
                                    }}
                                >
                                    {[portfolio.niche, portfolio.city].filter(Boolean).join(' / ')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rating */}
                    {portfolio.averageRating > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '12px',
                            }}
                        >
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: i < Math.round(portfolio.averageRating) ? '#F0C060' : '#E5E5EA',
                                    }}
                                />
                            ))}
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '14px',
                                    color: '#8E8E93',
                                    fontWeight: 400,
                                    marginLeft: '4px',
                                }}
                            >
                                {portfolio.averageRating.toFixed(1)} ({portfolio.reviewsCount} {portfolio.reviewsCount === 1 ? 'შეფასება' : 'შეფასება'})
                            </div>
                        </div>
                    )}

                    {/* Bio */}
                    {portfolio.bio && (
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '13px',
                                fontWeight: 400,
                                color: '#636366',
                                lineHeight: 1.5,
                                marginBottom: '14px',
                                overflow: 'hidden',
                                maxHeight: '40px',
                            }}
                        >
                            {portfolio.bio.length > 100 ? `${portfolio.bio.slice(0, 100)}...` : portfolio.bio}
                        </div>
                    )}

                    {/* Services */}
                    {topServices.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                marginBottom: '14px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#1C1C1E',
                                    marginBottom: '2px',
                                }}
                            >
                                სერვისები
                            </div>
                            {topServices.map((s, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '13px',
                                        color: '#48484A',
                                        padding: '4px 10px',
                                        background: '#F2F2F7',
                                        borderRadius: '6px',
                                    }}
                                >
                                    <div style={{ display: 'flex' }}>
                                        {s.name}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            fontWeight: 700,
                                            color: '#1C1C1E',
                                        }}
                                    >
                                        {formatPrice(s.price, s.startingFrom)}
                                    </div>
                                </div>
                            ))}
                            {portfolio.services.length > 3 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        fontSize: '12px',
                                        color: '#AEAEB2',
                                    }}
                                >
                                    +{portfolio.services.length - 3} სხვა სერვისი
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats row */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '16px',
                            marginBottom: '12px',
                        }}
                    >
                        {publishedCount > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '13px',
                                    color: '#8E8E93',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#B490F5',
                                    }}
                                />
                                <div style={{ display: 'flex' }}>
                                    {publishedCount} ფოტო
                                </div>
                            </div>
                        )}
                        {portfolio.services.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '13px',
                                    color: '#8E8E93',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#F0C060',
                                    }}
                                />
                                <div style={{ display: 'flex' }}>
                                    {portfolio.services.length} სერვისი
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Socials */}
                    {socials.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '12px',
                                color: '#AEAEB2',
                                marginBottom: '8px',
                            }}
                        >
                            {socials.join(' / ')}
                        </div>
                    )}

                    {/* Brand — pushed to bottom */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            marginTop: 'auto',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#1C1C1E',
                            }}
                        >
                            GLOW
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#B490F5',
                                marginLeft: '2px',
                                marginBottom: '5px',
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
        { ...size, fonts },
    );
}
