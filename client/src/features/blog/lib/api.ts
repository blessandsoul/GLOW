import fs from 'fs'
import path from 'path'

import { getAllPosts, getPostBySlug as getMdxPost } from './mdx'

import type { BlogPost, BlogLocale } from '../types'

type CoverMapping = Record<
  string,
  {
    path: string
    credit: string
    creditUrl: string
    source: 'unsplash' | 'pexels'
    sourceUrl: string
  }
>

let coverMapping: CoverMapping | null = null

function getCoverMapping(): CoverMapping {
  if (coverMapping) return coverMapping

  const mappingPath = path.join(process.cwd(), 'content', 'blog', 'covers.json')
  try {
    if (fs.existsSync(mappingPath)) {
      coverMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'))
      return coverMapping!
    }
  } catch {
    // Silently fall back
  }

  coverMapping = {}
  return coverMapping
}

function ensureCoverImage(post: Partial<BlogPost>): Partial<BlogPost> {
  if (!post.coverImage && post.slug) {
    const mapping = getCoverMapping()
    const entry = mapping[post.slug]

    if (entry?.path) {
      post.coverImage = entry.path
      post.coverCredit = {
        credit: entry.credit,
        creditUrl: entry.creditUrl,
        source: entry.source,
        sourceUrl: entry.sourceUrl,
      }
      return post
    }
  }

  if (!post.coverImage) {
    const staticCovers = [
      '/images/blog-covers/1.jpg',
      '/images/blog-covers/2.jpg',
      '/images/blog-covers/3.jpg',
    ]

    const seed = post.slug || post.title || 'default'
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % staticCovers.length

    post.coverImage = staticCovers[index]
  }

  if (!post.coverCredit && post.slug) {
    const mapping = getCoverMapping()
    const entry = mapping[post.slug]
    if (entry) {
      post.coverCredit = {
        credit: entry.credit,
        creditUrl: entry.creditUrl,
        source: entry.source,
        sourceUrl: entry.sourceUrl,
      }
    }
  }

  return post
}

export async function getPosts(locale: BlogLocale): Promise<BlogPost[]> {
  const posts = getAllPosts(locale, [
    'id',
    'title',
    'date',
    'slug',
    'author',
    'coverImage',
    'excerpt',
    'tags',
    'readTime',
  ])
  return posts.map(ensureCoverImage) as BlogPost[]
}

export async function getPostBySlug(
  slug: string,
  locale: BlogLocale,
): Promise<BlogPost | undefined> {
  const post = getMdxPost(slug, locale, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'coverImage',
    'excerpt',
    'tags',
    'readTime',
  ])

  if (!post.slug) return undefined
  return ensureCoverImage(post) as BlogPost
}

export async function getRelatedPosts(
  currentSlug: string,
  locale: BlogLocale,
  limit: number = 3,
): Promise<BlogPost[]> {
  const allPosts = await getPosts(locale)
  const current = allPosts.find((p) => p.slug === currentSlug)
  if (!current) return []

  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p) => p.post)
}

export function getBlogTranslations(
  locale: BlogLocale,
): Record<string, string> {
  const filePath = path.join(
    process.cwd(),
    'content',
    'blog',
    'translations',
    `${locale}.json`,
  )
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return {}
  }
}

export { getBlogPath } from './utils'
