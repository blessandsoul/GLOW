import { generateBlogPostMetadata, BlogPostPage } from '@/features/blog/lib/pages'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return generateBlogPostMetadata(slug, 'ka')
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<React.ReactElement> {
  const { slug } = await params
  return <BlogPostPage slug={slug} locale="ka" />
}
