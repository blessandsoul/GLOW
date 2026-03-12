import type { BlogLocale } from '../types'

export function getBlogPath(locale: BlogLocale, slug?: string): string {
  const prefix = locale === 'ka' ? '' : `/${locale}`
  return slug ? `${prefix}/blog/${slug}` : `${prefix}/blog`
}

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
] as const

export function formatBlogDate(dateStr: string, locale: BlogLocale): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const year = date.getFullYear()

  if (locale === 'ka') {
    return `${day} ${GEORGIAN_MONTHS[date.getMonth()]}, ${year}`
  }

  return date.toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )
}
