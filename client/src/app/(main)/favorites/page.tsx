'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FavoriteMastersGrid } from '@/features/favorites/components/FavoriteMastersGrid';
import { FavoritePortfolioGrid } from '@/features/favorites/components/FavoritePortfolioGrid';
import type { FavoriteTab } from '@/features/favorites/types/favorites.types';

export default function FavoritesPage(): React.ReactElement {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = (searchParams.get('tab') as FavoriteTab) ?? 'masters';

    const handleTabChange = (value: string): void => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`/favorites?${params.toString()}`);
    };

    return (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Favorites</h1>

            <Tabs value={tab} onValueChange={handleTabChange} className="mt-6">
                <TabsList>
                    <TabsTrigger value="masters">Masters</TabsTrigger>
                    <TabsTrigger value="portfolio">Works</TabsTrigger>
                </TabsList>

                <TabsContent value="masters" className="mt-6">
                    <FavoriteMastersGrid />
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                    <FavoritePortfolioGrid />
                </TabsContent>
            </Tabs>
        </div>
    );
}
