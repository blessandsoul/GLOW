import { NextResponse } from 'next/server'
import { getPosts } from '@/features/blog/lib/api'

import type { BlogLocale } from '@/features/blog/types'

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const locale = (searchParams.get('locale') || 'ka') as BlogLocale
  const limit = Math.min(Number(searchParams.get('limit') || '3'), 6)

  const posts = await getPosts(locale)
  const latest = posts.slice(0, limit).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    date: p.date,
    tags: p.tags,
  }))

  return NextResponse.json(latest)
}
