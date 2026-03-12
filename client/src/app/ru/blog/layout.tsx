import { BlogLayout } from '@/features/blog/components/BlogLayout'

export default function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <BlogLayout>{children}</BlogLayout>
}
