import { notFound } from 'next/navigation'

import { getPosts, getPostBySlug, getRelatedPosts, getBlogTranslations, getBlogPath } from './api'
import { BlogList } from '../components/BlogList'
import { BlogPost } from '../components/BlogPost'
import { RelatedPosts } from '../components/RelatedPosts'
import { ReadingProgress } from '../components/ReadingProgress'

import type { Metadata } from 'next'
import type { BlogLocale } from '../types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glow.ge'

// --- Blog List Page ---

export async function generateBlogListMetadata(locale: BlogLocale): Promise<Metadata> {
  const t = getBlogTranslations(locale)
  const path = '/blog'

  return {
    title: t.title || 'Blog',
    description: t.description || '',
    alternates: {
      canonical: locale === 'ka' ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`,
      languages: {
        ka: `${BASE_URL}${path}`,
        en: `${BASE_URL}/en${path}`,
        ru: `${BASE_URL}/ru${path}`,
      },
    },
    openGraph: {
      title: t.title || 'Blog',
      description: t.description || '',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title || 'Blog',
      description: t.description || '',
    },
  }
}

export async function BlogListPage({ locale }: { locale: BlogLocale }): Promise<React.ReactElement> {
  const posts = await getPosts(locale)
  const t = getBlogTranslations(locale)

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20">
      <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight leading-tight sm:text-5xl md:text-6xl text-foreground">
          {t.title}
        </h1>
        <p className="text-xl text-muted-foreground">{t.subtitle}</p>
      </div>

      <BlogList
        posts={posts}
        locale={locale}
        noPostsLabel={t.noPosts}
        readMoreLabel={t.readMore}
      />
    </div>
  )
}

// --- Blog Post Page ---

export async function generateBlogPostMetadata(
  slug: string,
  locale: BlogLocale,
): Promise<Metadata> {
  const post = await getPostBySlug(slug, locale)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const url =
    locale === 'ka'
      ? `${BASE_URL}/blog/${slug}`
      : `${BASE_URL}/${locale}/blog/${slug}`

  const coverImage = post.coverImage?.startsWith('http')
    ? post.coverImage
    : post.coverImage
      ? `${BASE_URL}${post.coverImage}`
      : `${BASE_URL}/og-image.png`

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: url,
      languages: {
        ka: `${BASE_URL}/blog/${slug}`,
        en: `${BASE_URL}/en/blog/${slug}`,
        ru: `${BASE_URL}/ru/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: 'Glow.GE',
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [coverImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export async function BlogPostPage({
  slug,
  locale,
}: {
  slug: string
  locale: BlogLocale
}): Promise<React.ReactElement> {
  const post = await getPostBySlug(slug, locale)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(slug, locale, 3)
  const t = getBlogTranslations(locale)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Glow.GE',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':
        locale === 'ka'
          ? `${BASE_URL}/blog/${slug}`
          : `${BASE_URL}/${locale}/blog/${slug}`,
    },
    keywords: post.tags.join(', '),
    wordCount: post.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
    articleSection: post.tags[0],
    inLanguage: locale === 'ka' ? 'ka' : locale === 'ru' ? 'ru' : 'en',
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: t.title || 'Blog',
        item: locale === 'ka' ? `${BASE_URL}/blog` : `${BASE_URL}/${locale}/blog`,
      },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  }

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogPost post={post} locale={locale} translations={t} />
      <div className="container mx-auto max-w-4xl px-4 md:px-6 lg:px-8 pb-20">
        <RelatedPosts posts={relatedPosts} locale={locale} label={t.relatedPosts} />
      </div>
    </>
  )
}
