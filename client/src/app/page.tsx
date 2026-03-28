'use client';

import { EditorialTopBar } from '@/features/landing/components/editorial/EditorialTopBar';
import { EditorialHero } from '@/features/landing/components/editorial/EditorialHero';
import { EditorialWhySection } from '@/features/landing/components/editorial/EditorialWhySection';
import { EditorialCategories } from '@/features/landing/components/editorial/EditorialCategories';
import { EditorialSteps } from '@/features/landing/components/editorial/EditorialSteps';
import { EditorialArtists } from '@/features/landing/components/editorial/EditorialArtists';
import { EditorialBottomNav } from '@/features/landing/components/editorial/EditorialBottomNav';

export default function HomePage(): React.ReactElement {
  return (
    <div
      className="editorial-theme min-h-dvh flex flex-col overflow-x-hidden selection:bg-(--ed-primary)/20"
      style={{ background: 'var(--ed-surface)', color: 'var(--ed-on-surface)' }}
    >
      <EditorialTopBar />
      <main className="flex-1 pt-14">
        <EditorialHero />
        <EditorialWhySection />
        <EditorialCategories />
        <EditorialSteps />
        <EditorialArtists />
      </main>
      <EditorialBottomNav />
    </div>
  );
}
