'use client';

import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface Example {
    before: string;
    after: string;
    alt: string;
}

const EXAMPLES: Example[] = [
    {
        // Skin retouch — natural portrait before/after
        before: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&crop=face',
        after: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=face',
        alt: 'skin-retouch',
    },
    {
        // Lash & eye makeup — close eye portrait
        before: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=800&fit=crop&crop=face',
        after: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=800&fit=crop&crop=face',
        alt: 'lash-makeup',
    },
    {
        // Glow skin treatment
        before: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop&crop=face',
        after: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&crop=face',
        alt: 'glow-treatment',
    },
    {
        // Nail art before/after
        before: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=800&fit=crop',
        after: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&h=800&fit=crop',
        alt: 'nail-art',
    },
];

export function BeforeAfterSection(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
                {/* Heading */}
                <div className="text-center mb-8 lg:mb-16 flex flex-col items-center">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
                        {t('ui.text_oqe2au')}
                    </span>
                    <h2 className="text-3xl lg:text-4xl xl:text-5xl font-light tracking-tight text-zinc-900 dark:text-white mb-3 lg:mb-4">
                        {t('ui.text_sqzvf8')}{' '}
                        <span className="italic font-georgian">{t('ui.text_psd5f9')}</span>
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base lg:text-lg font-light max-w-2xl mx-auto">
                        {t('ui.text_50r28u')}
                    </p>
                </div>

                {/* Mobile: horizontal snap-scroll */}
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 lg:hidden">
                    {EXAMPLES.map((example, i) => (
                        <div
                            key={example.alt}
                            className="w-[72vw] sm:w-[55vw] shrink-0 snap-center"
                        >
                            <BeforeAfterSlider
                                beforeSrc={example.before}
                                afterSrc={example.after}
                                alt={example.alt}
                                showHint={i === 0}
                            />
                        </div>
                    ))}
                </div>

                {/* Desktop: 4-column grid */}
                <div className="hidden lg:grid lg:grid-cols-4 gap-6">
                    {EXAMPLES.map((example) => (
                        <BeforeAfterSlider
                            key={example.alt}
                            beforeSrc={example.before}
                            afterSrc={example.after}
                            alt={example.alt}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
