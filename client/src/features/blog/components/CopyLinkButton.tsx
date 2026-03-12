'use client'

import { useState } from 'react'
import { LinkIcon, CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyLinkButtonProps {
  copyLabel: string
  copiedLabel: string
}

export function CopyLinkButton({ copyLabel, copiedLabel }: CopyLinkButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
        'border',
        copied
          ? 'bg-success/10 border-success/30 text-success'
          : 'bg-card/60 border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
      )}
      aria-label={copyLabel}
    >
      {copied ? (
        <>
          <CheckIcon className="w-3.5 h-3.5" />
          {copiedLabel}
        </>
      ) : (
        <>
          <LinkIcon className="w-3.5 h-3.5" />
          {copyLabel}
        </>
      )}
    </button>
  )
}
