'use client'

import { useEffect, useState } from 'react'
import { ListIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
  label: string
}

export function TableOfContents({ content, label }: TableOfContentsProps): React.ReactElement | null {
  const [activeId, setActiveId] = useState<string>('')
  const [items, setItems] = useState<TOCItem[]>([])

  useEffect(() => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const headings = doc.querySelectorAll('h2, h3')
    const tocItems: TOCItem[] = []

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`
      tocItems.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      })
    })

    setItems(tocItems)
  }, [content])

  useEffect(() => {
    if (!items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 },
    )

    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  return (
    <nav
      aria-label="Table of Contents"
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <ListIcon className="w-4 h-4 text-primary" />
        <span>{label}</span>
      </div>
      <ol className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(item.id)
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - 100
                  window.scrollTo({ top, behavior: 'smooth' })
                }
              }}
              className={cn(
                'block py-1 text-sm transition-all duration-200 hover:text-primary',
                item.level === 3 && 'pl-4',
                activeId === item.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
