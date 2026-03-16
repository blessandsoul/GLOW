import type { MetadataRoute } from 'next';

import { getAllPosts } from '@/features/blog/lib/mdx';

import type { BlogLocale } from '@/features/blog/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glow.ge';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const LOCALES: BlogLocale[] = ['ka', 'en', 'ru'];

interface CatalogMaster {
  username: string;
  updatedAt?: string;
}

async function fetchMasters(): Promise<CatalogMaster[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/masters/catalog?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items ?? [];
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/masters`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
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
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/refund`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    // Blog index with alternates
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

  // ── Blog posts ────────────────────────────────────────────────
  const slugsSeen = new Set<string>();
  const blogPages: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const posts = getAllPosts(locale, ['slug', 'date']);
    for (const post of posts) {
      if (!post.slug || slugsSeen.has(post.slug)) continue;
      slugsSeen.add(post.slug);

      blogPages.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.date ? new Date(post.date) : new Date(),
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

  // ── Masters (specialist profiles) ─────────────────────────────
  const masters = await fetchMasters();
  const masterPages: MetadataRoute.Sitemap = masters
    .filter((m) => m.username)
    .map((master) => ({
      url: `${BASE_URL}/specialist/${master.username}`,
      lastModified: master.updatedAt
        ? new Date(master.updatedAt)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...blogPages, ...masterPages];
}
