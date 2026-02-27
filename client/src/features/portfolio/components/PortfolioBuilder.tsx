'use client';

import React from 'react';
import { SpinnerGap, CloudCheck, Warning, ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { usePortfolioBuilder } from '../hooks/usePortfolioBuilder';
import { BuilderNav } from './BuilderNav';
import { CompletionProgress } from './CompletionProgress';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { GallerySection } from './GallerySection';
import { PreviewSection } from './PreviewSection';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function FloatingSaveIndicator({ status }: { status: SaveStatus }): React.ReactElement | null {
    const { t } = useLanguage();
    if (status === 'idle') return null;

    return (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200">
            <div
                className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg backdrop-blur-md transition-colors duration-200',
                    status === 'saving' && 'border-border/50 bg-background/90 text-muted-foreground',
                    status === 'saved' && 'border-success/30 bg-success/10 text-success',
                    status === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
                )}
            >
                {status === 'saving' && (
                    <>
                        <SpinnerGap size={14} className="animate-spin" />
                        <span className="text-xs font-medium">{t('portfolio.saving')}</span>
                    </>
                )}
                {status === 'saved' && (
                    <>
                        <CloudCheck size={14} weight="fill" />
                        <span className="text-xs font-medium">{t('portfolio.saved')}</span>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <Warning size={14} weight="fill" />
                        <span className="text-xs font-medium">{t('portfolio.save_failed')}</span>
                    </>
                )}
            </div>
        </div>
    );
}

export function PortfolioBuilder(): React.ReactElement {
    const { t } = useLanguage();
    const {
        user,
        form,
        updateField,
        saveStatus,
        items,
        jobResults,
        portfolioImageUrls,
        addItem,
        updateItem,
        deleteItem,
        progress,
        activeSection,
        scrollToSection,
        isLoading,
        isResultsLoading,
    } = usePortfolioBuilder();

    if (isLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <FloatingSaveIndicator status={saveStatus} />

            {/* Header */}
            <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('portfolio.header_title')}</h1>
                    {user?.username && (
                        <Button
                            size="sm"
                            className="shrink-0 gap-1.5"
                            onClick={() => window.open(`/specialist/${user.username}`, '_blank')}
                        >
                            <ArrowSquareOut size={14} />
                            {t('portfolio.nav_preview')}
                        </Button>
                    )}
                </div>

                <CompletionProgress
                    percentage={progress.percentage}
                    missingItems={progress.missingItems}
                    criteria={progress.criteria}
                />
            </div>

            {/* Nav + Content */}
            <div className="md:flex md:gap-8">
                <BuilderNav
                    activeSection={activeSection}
                    onSectionClick={scrollToSection}
                    criteria={progress.criteria}
                />

                <main className="flex-1 space-y-10 pb-24 sm:space-y-16">
                    <section id="about">
                        <AboutSection
                            form={form}
                            updateField={updateField}
                            saveStatus={saveStatus}
                        />
                    </section>

                    <section id="services">
                        <ServicesSection
                            form={form}
                            updateField={updateField}
                        />
                    </section>

                    <section id="gallery">
                        <GallerySection
                            items={items}
                            jobResults={jobResults}
                            portfolioImageUrls={portfolioImageUrls}
                            isResultsLoading={isResultsLoading}
                            onAdd={addItem}
                            onUpdate={updateItem}
                            onDelete={deleteItem}
                        />
                    </section>

                    <section id="preview">
                        <PreviewSection
                            form={form}
                            items={items}
                            user={user}
                        />
                    </section>
                </main>
            </div>
        </div>
    );
}
