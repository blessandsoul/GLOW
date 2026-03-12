'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getBlogPath, formatBlogDate } from '../lib/utils'

import type { BlogPost, BlogLocale } from '../types'

interface RelatedPostsProps {
  posts: BlogPost[]
  locale: BlogLocale
  label: string
}

export function RelatedPosts({ posts, locale, label }: RelatedPostsProps): React.ReactElement | null {
  if (!posts.length) return null

  return (
    <aside className="mt-16 pt-10 border-t border-border" aria-label={label}>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">{label}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={getBlogPath(locale, post.slug)}
            className="group flex gap-3 p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-card/80 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="80px"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {post.title}
              </h3>
              <time
                dateTime={post.date}
                className="text-xs text-muted-foreground/60 mt-1"
              >
                {formatBlogDate(post.date, locale)}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}
