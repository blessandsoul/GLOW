'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XIcon } from 'lucide-react'
import { getBlogPath } from '../lib/utils'
import { BlogCard } from './BlogCard'

import type { BlogPost, BlogLocale } from '../types'

interface BlogListProps {
  posts: BlogPost[]
  locale: BlogLocale
  noPostsLabel: string
  readMoreLabel: string
}

export function BlogList({ posts, locale, noPostsLabel, readMoreLabel }: BlogListProps): React.ReactElement {
  const searchParams = useSearchParams()
  const activeTag = searchParams.get('tag')

  const filteredPosts = activeTag
    ? posts.filter((post) => post.tags.includes(activeTag))
    : posts

  return (
    <>
      {activeTag && (
        <div className="flex items-center gap-2 mb-8">
          <span className="text-sm text-muted-foreground">
            {activeTag}
          </span>
          <Link
            href={getBlogPath(locale)}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
            aria-label="Clear filter"
          >
            <XIcon className="w-3 h-3" />
          </Link>
        </div>
      )}

      {!filteredPosts.length ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">{noPostsLabel}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} locale={locale} readMoreLabel={readMoreLabel} />
          ))}
        </div>
      )}
    </>
  )
}
