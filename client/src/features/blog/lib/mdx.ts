import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import type { BlogPost, BlogLocale } from '../types'

const contentDirectory = path.join(process.cwd(), 'content/blog')

function getLocaleDirectory(locale: BlogLocale): string {
  return path.join(contentDirectory, locale)
}

export function getPostSlugs(locale: BlogLocale): string[] {
  const dir = getLocaleDirectory(locale)
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
}

export function getPostBySlug(
  slug: string,
  locale: BlogLocale,
  fields: string[] = [],
): Partial<BlogPost> {
  const realSlug = slug.replace(/\.mdx$/, '')
  const fullPath = path.join(getLocaleDirectory(locale), `${realSlug}.mdx`)

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    const items: Record<string, unknown> = {}

    fields.forEach((field) => {
      if (field === 'slug') {
        items[field] = realSlug
      }
      if (field === 'id') {
        items[field] = realSlug
      }
      if (field === 'content') {
        items[field] = content
      }
      if (typeof data[field] !== 'undefined') {
        items[field] = data[field]
      }
    })

    return items as Partial<BlogPost>
  } catch {
    return {}
  }
}

export function getAllPosts(
  locale: BlogLocale,
  fields: string[] = [],
): Partial<BlogPost>[] {
  const slugs = getPostSlugs(locale)
  const posts = slugs
    .map((slug) => getPostBySlug(slug, locale, fields))
    .sort((post1, post2) => (post1.date! > post2.date! ? -1 : 1))
  return posts
}
