'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/hooks/useLanguage'
import { getBlogPath } from '../lib/utils'
import type { BlogLocale } from '../types'

interface BlogPreview {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImage: string
  date: string
  tags: string[]
}

export function HomeBlogSection(): React.ReactElement | null {
  const [posts, setPosts] = useState<BlogPreview[]>([])
  const { t, language } = useLanguage()

  useEffect(() => {
    fetch(`/api/blog/latest?locale=${language}&limit=3`)
      .then((res) => res.json())
      .then((data: BlogPreview[]) => setPosts(data))
      .catch(() => {})
  }, [language])

  if (!posts.length) return null

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-16 mb-8 relative z-20">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('blog_section.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('blog_section.subtitle')}
          </p>
        </div>
        <Link
          href={getBlogPath(language as BlogLocale)}
          className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all duration-200"
        >
          {t('blog_section.view_all')}
          <ArrowRight size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={getBlogPath(language as BlogLocale, post.slug)}
              className={cn(
                'group relative flex flex-col h-full rounded-2xl',
                'border border-border/40 bg-card/60 backdrop-blur-md',
                'shadow-sm hover:shadow-xl hover:shadow-primary/5',
                'transition-all duration-300 ease-out hover:-translate-y-1',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                'overflow-hidden',
              )}
            >
              {/* Cover */}
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
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-all duration-200 group-hover:gap-2">
                  {t('blog_section.read_more')}
                  <ArrowRight size={12} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Mobile view all */}
      <div className="mt-6 flex justify-center sm:hidden">
        <Link
          href={getBlogPath(language as BlogLocale)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          {t('blog_section.view_all')}
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </section>
  )
}
