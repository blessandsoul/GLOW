'use client'

import type { BlogPost, BlogLocale } from '../types'
import { BlogCard } from './BlogCard'

interface BlogListProps {
  posts: BlogPost[]
  locale: BlogLocale
  noPostsLabel: string
  readMoreLabel: string
}

export function BlogList({ posts, locale, noPostsLabel, readMoreLabel }: BlogListProps): React.ReactElement {
  if (!posts.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{noPostsLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <BlogCard key={post.id} post={post} index={index} locale={locale} readMoreLabel={readMoreLabel} />
      ))}
    </div>
  )
}
