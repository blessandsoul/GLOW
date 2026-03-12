import type { BlogLocale } from '../types'

export function getBlogPath(locale: BlogLocale, slug?: string): string {
  const prefix = locale === 'ka' ? '' : `/${locale}`
  return slug ? `${prefix}/blog/${slug}` : `${prefix}/blog`
}
