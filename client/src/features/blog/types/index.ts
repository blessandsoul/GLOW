export interface Author {
  name: string
  avatar?: string
  role?: string
}

export interface CoverCredit {
  credit: string
  creditUrl: string
  source: 'unsplash' | 'pexels'
  sourceUrl: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  coverCredit?: CoverCredit
  coverQuery?: string
  date: string
  readTime: string
  author: Author
  tags: string[]
}

export type BlogLocale = 'ka' | 'en' | 'ru'
