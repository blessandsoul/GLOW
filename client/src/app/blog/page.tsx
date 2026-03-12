import { generateBlogListMetadata, BlogListPage } from '@/features/blog/lib/pages'

import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return generateBlogListMetadata('ka')
}

export default function Page(): React.ReactElement {
  return <BlogListPage locale="ka" />
}
