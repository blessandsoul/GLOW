'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { getBlogPath } from '../lib/utils'

import type { BlogPost, BlogLocale } from '../types'

interface BlogCardProps {
  post: BlogPost
  locale: BlogLocale
  readMoreLabel: string
  className?: string
  index?: number
}

export function BlogCard({ post, locale, readMoreLabel, className, index = 0 }: BlogCardProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={getBlogPath(locale, post.slug)}
        className={cn(
          'group relative flex flex-col h-full cursor-pointer rounded-2xl',
          'border border-border/40 bg-card/60 backdrop-blur-md',
          'shadow-sm hover:shadow-xl hover:shadow-primary/5',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-1',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'overflow-hidden',
          className,
        )}
      >
        {/* Cover Image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={post.coverImage.startsWith('/api/og')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

          {/* Tags */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="text-base font-bold leading-snug tracking-tight text-foreground mb-1.5 line-clamp-2 transition-colors duration-200 group-hover:text-primary">
            {post.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {post.excerpt.length > 100
              ? post.excerpt.slice(0, 100) + '... '
              : post.excerpt + ' '}
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary whitespace-nowrap transition-all duration-200 group-hover:gap-1.5">
              {readMoreLabel}{' '}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
