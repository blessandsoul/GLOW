'use client';

import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { EditorialHero } from '@/features/landing/components/editorial/EditorialHero';
import { EditorialWhySection } from '@/features/landing/components/editorial/EditorialWhySection';
import { EditorialCategories } from '@/features/landing/components/editorial/EditorialCategories';
import { EditorialSteps } from '@/features/landing/components/editorial/EditorialSteps';
import { EditorialArtists } from '@/features/landing/components/editorial/EditorialArtists';

export default function HomePage(): React.ReactElement {
  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 pt-14">
        <EditorialHero />
        <EditorialWhySection />
        <EditorialCategories />
        <EditorialSteps />
        <EditorialArtists />
      </main>
      <MobileBottomNav />
    </div>
  );
}
