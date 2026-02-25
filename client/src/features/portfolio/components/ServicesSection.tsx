'use client';

import React, { useCallback, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AddServicePanel } from '@/features/profile/components/AddServicePanel';
import { ServiceRow } from '@/features/profile/components/ServiceRow';
import { SERVICE_CATEGORIES } from '@/features/profile/types/profile.types';
import type { ServiceItem, ProfileFormData } from '@/features/profile/types/profile.types';

interface ServicesSectionProps {
    form: ProfileFormData;
    updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
}

export function ServicesSection({ form, updateField }: ServicesSectionProps): React.ReactElement {
    const { t } = useLanguage();
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const handleAddService = useCallback((service: ServiceItem): void => {
        updateField('services', [...form.services, service]);
        setShowAddPanel(false);
        setDrawerOpen(false);
    }, [form.services, updateField]);

    const handleRemoveService = useCallback((index: number): void => {
        updateField('services', form.services.filter((_, i) => i !== index));
    }, [form.services, updateField]);

    const handleServiceChange = useCallback(
        (index: number, field: keyof ServiceItem, value: string | number): void => {
            updateField('services', form.services.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            ));
        },
        [form.services, updateField]
    );

    const servicesByCategory = SERVICE_CATEGORIES
        .map((cat) => ({
            category: cat,
            services: form.services
                .map((s, i) => ({ service: s, originalIndex: i }))
                .filter(({ service }) => service.category === cat.id),
        }))
        .filter(({ services }) => services.length > 0);

    const handleOpenAdd = (): void => {
        if (isDesktop) {
            setShowAddPanel(true);
        } else {
            setDrawerOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t('portfolio.nav_services')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {form.services.length > 0
                            ? `${form.services.length} ${t('portfolio.services_added')}`
                            : t('portfolio.services_pricing')}
                    </p>
                </div>
                {!showAddPanel && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleOpenAdd}
                    >
                        <Plus size={14} />
                        {t('ui.text_usbwt5')}
                    </Button>
                )}
            </div>

            {/* Desktop inline add panel */}
            {showAddPanel && isDesktop && (
                <AddServicePanel
                    onAdd={handleAddService}
                    onCancel={() => setShowAddPanel(false)}
                />
            )}

            {/* Mobile drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="px-0">
                        <DrawerTitle>{t('portfolio.add_service')}</DrawerTitle>
                    </DrawerHeader>
                    <AddServicePanel
                        onAdd={handleAddService}
                        onCancel={() => setDrawerOpen(false)}
                    />
                </DrawerContent>
            </Drawer>

            {/* Services list */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
                {form.services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-3 rounded-full bg-muted p-3">
                            <Plus size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{t('portfolio.no_services')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('portfolio.no_services_desc')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {servicesByCategory.map(({ category, services }) => (
                            <div key={category.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {category.label}
                                    </span>
                                    <div className="h-px flex-1 bg-border/60" />
                                    <span className="text-xs text-muted-foreground">{services.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {services.map(({ service, originalIndex }) => (
                                        <ServiceRow
                                            key={originalIndex}
                                            service={service}
                                            index={originalIndex}
                                            showLabels={false}
                                            onRemove={handleRemoveService}
                                            onChange={handleServiceChange}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
