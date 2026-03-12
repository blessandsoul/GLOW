import { Header } from '@/components/layout/Header'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export function BlogLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div className="relative min-h-dvh pt-14">
      <Header />
      <main className="pb-16 md:pb-0">{children}</main>
      <MobileBottomNav />
    </div>
  )
}
