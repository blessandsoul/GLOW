import type { MetadataRoute } from 'next';
import { getPosts } from '@/features/blog/lib/api';

import type { BlogLocale } from '@/features/blog/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glow.ge';

const LOCALES: BlogLocale[] = ['ka', 'en', 'ru'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Blog index pages
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          ka: `${BASE_URL}/blog`,
          en: `${BASE_URL}/en/blog`,
          ru: `${BASE_URL}/ru/blog`,
        },
      },
    },
  ];

  // Blog posts — collect from all locales, dedupe by slug
  const slugsSeen = new Set<string>();
  const blogPages: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const posts = await getPosts(locale);
    for (const post of posts) {
      if (slugsSeen.has(post.slug)) continue;
      slugsSeen.add(post.slug);

      blogPages.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: {
          languages: {
            ka: `${BASE_URL}/blog/${post.slug}`,
            en: `${BASE_URL}/en/blog/${post.slug}`,
            ru: `${BASE_URL}/ru/blog/${post.slug}`,
          },
        },
      });
    }
  }

  return [...staticPages, ...blogPages];
}
