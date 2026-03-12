'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { TableOfContents } from './TableOfContents'
import { getBlogPath } from '../lib/utils'

import type { BlogPost as BlogPostType, BlogLocale } from '../types'

interface BlogPostProps {
  post: BlogPostType
  locale: BlogLocale
  translations: Record<string, string>
}

export function BlogPost({ post, locale, translations }: BlogPostProps): React.ReactElement {
  return (
    <article className="container mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-10 md:py-14">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 md:mb-12 text-center md:text-left"
      >
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex justify-center md:justify-start">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors duration-200"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            <li>
              <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/40" />
            </li>
            <li>
              <Link
                href={getBlogPath(locale)}
                className="hover:text-foreground transition-colors duration-200"
              >
                {translations.title}
              </Link>
            </li>
            <li>
              <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/40" />
            </li>
            <li
              className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none"
              aria-current="page"
            >
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-foreground">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(
              locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' },
            )}
          </time>
          {post.readTime && (
            <>
              <span className="text-border">|</span>
              <span>{post.readTime}</span>
            </>
          )}
        </div>
      </motion.header>

      {/* Cover Image */}
      <motion.figure
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden mb-12 shadow-2xl border border-border/50"
      >
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          priority
          className="object-cover transition-transform duration-700 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
          unoptimized={post.coverImage.startsWith('/api/og')}
        />
        {post.coverCredit && (
          <figcaption className="absolute bottom-0 right-0 px-3 py-1.5 text-[10px] text-white/70 bg-black/30 backdrop-blur-sm rounded-tl-lg">
            <a
              href={post.coverCredit.creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              {post.coverCredit.credit}
            </a>
            {' / '}
            <a
              href={post.coverCredit.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors capitalize"
            >
              {post.coverCredit.source}
            </a>
          </figcaption>
        )}
      </motion.figure>

      <div className="grid lg:grid-cols-[250px_1fr] gap-0 lg:gap-10 items-start">
        {/* TOC - Desktop Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden lg:block sticky top-24"
        >
          <TableOfContents content={post.content} label={translations.tableOfContents} />
        </motion.aside>

        {/* TOC - Mobile */}
        <div className="lg:hidden mb-6">
          <TableOfContents content={post.content} label={translations.tableOfContents} />
        </div>

        {/* Content */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={cn(
            'prose prose-lg dark:prose-invert max-w-none',
            'prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24',
            'prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-8 prose-h2:md:mt-12 prose-h2:mb-4 prose-h2:text-foreground',
            'prose-h3:text-xl prose-h3:mt-6 prose-h3:md:mt-8 prose-h3:mb-3 prose-h3:text-foreground',
            'prose-p:leading-relaxed prose-p:text-muted-foreground prose-p:mb-5',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium',
            'prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-border/30',
            'prose-li:text-muted-foreground prose-li:marker:text-primary/40',
            'prose-strong:text-foreground prose-strong:font-bold',
            'prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:not-italic',
            'prose-code:text-primary prose-code:bg-primary/5 prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
            'prose-hr:border-border/30',
            '[&>*:first-child]:!mt-0',
          )}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-16 pt-8 border-t border-border/30"
      >
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href={getBlogPath(locale)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all duration-200"
          >
            ← {translations.backToBlog}
          </Link>
        </div>
      </motion.footer>
    </article>
  )
}
